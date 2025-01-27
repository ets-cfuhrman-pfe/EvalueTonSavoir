# Déploiement de Services avec Ansible et Docker Compose

Ce guide explique comment utiliser Ansible pour configurer et déployer des services Docker avec `docker-compose`.

## Prérequis

1. **Ansible** : Assurez-vous qu'Ansible est installé sur votre système.
   - [Guide d'installation d'Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)

2. **Docker et Docker Compose** : Docker doit être installé et configuré pour fonctionner avec Ansible.
   - Installez Docker : [Documentation Docker](https://docs.docker.com/get-docker/)
   - Docker Compose est inclus comme plugin Docker dans les versions récentes de Docker.

3. **WSL (pour Windows)** : Si vous utilisez Windows, assurez-vous d'avoir configuré WSL et un environnement Ubuntu.

## Structure du projet

Le fichier `deploy.yml` contient les tâches Ansible nécessaires pour télécharger, configurer, et démarrer les services Docker en utilisant Docker Compose.

## Installation et de déploiement

### Lancer le déploiement avec Ansible

Pour exécuter le playbook Ansible `deploy.yml`, utilisez la commande suivante depuis le répertoire racine du projet :

`ansible-playbook -i inventory.ini deploy.yml`

### Vérification du déploiement

Une fois le playbook exécuté, Ansible télécharge Docker et Docker Compose, télécharge le fichier `docker-compose.yaml`, démarre Docker et lance les conteneurs spécifiés.

### Configuration et contenu du Playbook (deploy.yml)
Le playbook deploy.yml exécute les étapes suivantes :

1. Télécharge Docker Compose si ce dernier n'est pas encore présent.
2. Vérifie l'installation de Docker Compose pour s'assurer qu'il est opérationnel.
3. Démarre le service Docker si ce n'est pas déjà le cas.
4. Télécharge le fichier docker-compose.yaml depuis le dépôt Git spécifié.
5. Lance Docker Compose pour déployer les conteneurs définis dans docker-compose.yaml.
6. Vérifie l'état des conteneurs et affiche les conteneurs en cours d'exécution.