const Docker = require("dockerode");
const { Room } = require("../models/room.js");
const BaseRoomProvider = require("./base-provider.js");

class DockerRoomProvider extends BaseRoomProvider {
  constructor(config, roomRepository) {
    super(config, roomRepository);
    const dockerSocket = process.env.DOCKER_SOCKET || "/var/run/docker.sock";

    this.docker = new Docker({ socketPath: dockerSocket });
    this.docker_network = process.env.QUIZ_NETWORK_NAME || 'evaluetonsavoir_quiz_network';
  }

  async syncInstantiatedRooms() {
    let containers = await this.docker.listContainers();
    containers = containers.filter(container => container.Image === this.quiz_docker_image);

    const containerIds = new Set(containers.map(container => container.Id));

    for (let container of containers) {
      const container_name = container.Names[0].slice(1);
      if (!container_name.startsWith("room_")) {
        console.warn(`Le conteneur ${container_name} ne suit pas la convention de nommage, il sera supprimé.`);
        const curContainer = this.docker.getContainer(container.Id);
        await curContainer.stop();
        await curContainer.remove();
        containerIds.delete(container.Id);
        console.warn(`Le conteneur ${container_name} a été supprimé.`);
      }
      else {
        console.warn(`Conteneur orphelin trouvé : ${container_name}`);
        const roomId = container_name.slice(5);
        const room = await this.roomRepository.get(roomId);

        if (!room) {
          console.warn(`Le conteneur n'est pas dans notre base de données.`);
          const containerInfo = await this.docker.getContainer(container.Id).inspect();
          const containerIP = containerInfo.NetworkSettings.Networks.evaluetonsavoir_quiz_network.IPAddress;
          const host = `${containerIP}:4500`;
          console.warn(`Création de la salle ${roomId} dans notre base de donnée - hôte : ${host}`);
          return await this.roomRepository.create(new Room(roomId, container_name, host));
        }

        console.warn(`La salle ${roomId} est déjà dans notre base de données.`);
      }
    }
  }

  async createRoom(roomId, options) {
    const container_name = `room_${roomId}`;

    try {
      const containerConfig = {
        Image: this.quiz_docker_image,
        name: container_name,
        HostConfig: {
          NetworkMode: this.docker_network,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        },
        Env: [
          `ROOM_ID=${roomId}`,
          `PORT=${this.quiz_docker_port}`,
          ...(options.env || [])
        ]
      };

      if (this.quiz_expose_port) {
        containerConfig.ExposedPorts = {
          [`${this.quiz_docker_port}/tcp`]: {}
        };
        containerConfig.HostConfig.PortBindings = {
          [`${this.quiz_docker_port}/tcp`]: [{ HostPort: '' }] // Empty string for random port
        };
      }

      const container = await this.docker.createContainer(containerConfig);
      await container.start();

      const containerInfo = await container.inspect();
      const networkInfo = containerInfo.NetworkSettings.Networks[this.docker_network];

      if (!networkInfo) {
        throw new Error(`Le conteneur n'as pu se connecter au réseau:  ${this.docker_network}`);
      }

      const containerIP = networkInfo.IPAddress;
      const host = `http://${containerIP}:${this.quiz_docker_port}`;


      let health = false;
      let attempts = 0;
      const maxAttempts = 15;

      while (!health && attempts < maxAttempts) {
        try {
          const response = await fetch(`${host}/health`, {
            timeout: 1000
          });

          if (response.ok) {
            health = true;
            console.log(`Le conteneur  ${container_name} est tombé actif en ${attempts + 1} tentatives`);
          } else {
            throw new Error(`Health check failed with status ${response.status}`);
          }
        } catch (error) {
          attempts++;
          console.log(`Attente du conteneur: ${container_name} (tentative ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!health) {
        console.error(`Container ${container_name} failed health check after ${maxAttempts} attempts`);
        await container.stop();
        await container.remove();
        throw new Error(`Room ${roomId} did not respond within acceptable timeout`);
      }

      return await this.roomRepository.create(new Room(roomId, container_name, host, 0));
    } catch (error) {
      console.error(`Échec de la création de la salle ${roomId}:`, error);
      throw error;
    }
  }

  async deleteRoom(roomId) {
    const container_name = `room_${roomId}`;
    await this.roomRepository.delete(roomId);

    try {
      const container = this.docker.getContainer(container_name);
      const containerInfo = await container.inspect();

      if (containerInfo) {
        await container.stop();
        await container.remove();
        console.log(`Le conteneur pour la salle ${roomId} a été arrêté et supprimé.`);
      }
    } catch (error) {
      if (error.statusCode === 404) {
        console.warn(`Le conteneur pour la salle ${roomId} n'as pas été trouvé, la salle sera supprimée de la base de données.`);
      } else {
        console.error(`Erreur pour la salle ${roomId}:`, error);
        throw new Error("La salle :${roomId} n'as pas pu être supprimée.");
      }
    }

    console.log(`La salle ${roomId} a été supprimée.`);
  }

  async getRoomStatus(roomId) {
    const room = await this.roomRepository.get(roomId);
    if (!room) return null;

    try {
      const container = this.docker.getContainer(room.containerId || `room_${roomId}`);
      const info = await container.inspect();

      const updatedRoomInfo = {
        ...room,
        status: info.State.Running ? "running" : "terminated",
        containerStatus: {
          Running: info.State.Running,
          StartedAt: info.State.StartedAt,
          FinishedAt: info.State.FinishedAt,
        },
        lastUpdate: Date.now(),
      };

      await this.roomRepository.update(updatedRoomInfo);
      return updatedRoomInfo;
    } catch (error) {
      if (error.statusCode === 404) {
        console.warn(`Le conteneur pour la salle ${roomId} n'as pas été trouvé, il sera mis en état "terminé".`);
        const terminatedRoomInfo = {
          ...room,
          status: "terminated",
          containerStatus: {
            Running: false,
            StartedAt: room.containerStatus?.StartedAt || null,
            FinishedAt: Date.now(),
          },
          lastUpdate: Date.now(),
        };

        await this.roomRepository.update(terminatedRoomInfo);
        return terminatedRoomInfo;
      } else {
        console.error(`Une érreur s'est produite lors de l'obtention de l'état de la salle ${roomId}:`, error);
        return null;
      }
    }
  }

  async listRooms() {
    const rooms = await this.roomRepository.getAll();
    return rooms;
  }

  async cleanup() {
    const rooms = await this.roomRepository.getAll();
    for (let room of rooms) {
      if (room.mustBeCleaned) {
        try {
          await this.deleteRoom(room.id);
        } catch (error) {
          console.error(`Érreur lors du néttoyage de la salle ${room.id}:`, error);
        }
      }
    }

    let containers = await this.docker.listContainers();
    containers = containers.filter(container => container.Image === this.quiz_docker_image);
    const roomIds = rooms.map(room => room.id);

    for (let container of containers) {
      if (!roomIds.includes(container.Names[0].slice(6))) {
        const curContainer = this.docker.getContainer(container.Id);
        await curContainer.stop();
        await curContainer.remove();
        console.warn(`Conteneur orphelin ${container.Names[0]} supprimé.`);
      }
    }
  }
}

module.exports = DockerRoomProvider;
