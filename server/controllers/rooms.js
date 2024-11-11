const {Room} = require('../models/room.js');

const BaseRoomProvider = require('../roomsProviders/base-provider.js');
//const ClusterRoomProvider = require('../roomsProviders/cluster-provider.js');
const DockerRoomProvider = require('../roomsProviders/docker-provider.js');
//const KubernetesRoomProvider = require('../roomsProviders/kubernetes-provider');

const NB_CODE_CHARS = 6;
const DEFAULT_HOST = "172.18.0.5:4500" // must be room ip not name

class RoomsController {
    constructor(options = {}, roomRepository) {
        this.provider = this.createProvider(
            options.provider || process.env.ROOM_PROVIDER || 'cluster',
            options.providerOptions,
            roomRepository
        );
        this.roomRepository = roomRepository;
        this.setupCleanup();
    }

    createProvider(type, options, repository) {
        switch (type) {
            /*
            case 'cluster':
                return new ClusterRoomProvider(options, this.roomRepository);
                */
            // Uncomment these as needed
            case 'docker':
                return new DockerRoomProvider(options, repository);
            /*
            case 'kubernetes':
                return new KubernetesRoomProvider(options);
            */
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }

    setupCleanup() {
        setInterval(() => {
            this.provider.cleanup().catch(console.error);
        }, 30000);
    }

    async createRoom(options = {}) {
        let roomIdValid = false
        let roomId;

        while(!roomIdValid){
            roomId = options.roomId || this.generateRoomId();
            roomIdValid = !(await this.provider.getRoomInfo(roomId));
        }

        return await this.provider.createRoom(roomId,options);
    }

    async updateRoom(roomId, info) {
        return await this.provider.updateRoomInfo(roomId, {});
    }

    async deleteRoom(roomId) {
        return await this.provider.deleteRoom(roomId);
    }

    async getRoomStatus(roomId) {
        return await this.provider.getRoomStatus(roomId);
    }

    async listRooms() {
        return await this.provider.listRooms();
    }

    generateRoomId() {
        const characters = "0123456789";
        let result = "";
        for (let i = 0; i < NB_CODE_CHARS; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return result;
    }
}

module.exports = RoomsController;
