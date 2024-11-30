# Documentation de Déploiement avec Ansible

Ce guide explique comment utiliser **Ansible** pour déployer facilement le projet **ÉvalueTonSavoir**.

## Prérequis

### Système requis
- Un ordinateur sous **Linux** ou **Mac**.
- Pour **Windows**, installez [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) afin d'exécuter un environnement Ubuntu.

### Installation d'Ansible
1. **Sur Ubuntu (ou WSL2)** :
   Utilisez le gestionnaire de paquets `apt` :
   ```bash
   sudo apt update
   sudo apt install ansible-core
   ```
2. **Autres systèmes** :
   Consultez la [documentation officielle d'Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) pour connaître les étapes spécifiques à votre système.

### Installation de Docker et Docker Compose
- Suivez la [documentation Docker officielle](https://docs.docker.com/get-docker/) pour installer Docker.
- Docker Compose est inclus comme plugin Docker dans les versions récentes.

## Téléchargement des fichiers nécessaires

1. Clonez le dépôt Git contenant les fichiers Ansible :
   ```bash
   git clone https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir
   ```
2. Naviguez vers le répertoire `ansible` :
   ```bash
   cd EvalueTonSavoir/ansible
   ```

## Déploiement avec Ansible

### Commande de déploiement
Pour déployer l'application, exécutez la commande suivante dans le répertoire contenant le fichier `deploy.yml` :
```bash
ansible-playbook -i inventory.ini deploy.yml
```

### Structure des fichiers utilisés
- **`inventory.ini`** : Définit les cibles du déploiement. Par défaut, il est configuré pour un déploiement local.
- **`deploy.yml`** : Playbook contenant les instructions pour installer, configurer et déployer l'application.

### Étapes effectuées par Ansible
1. **Installation des dépendances** :
   - Vérifie et installe Docker si nécessaire.
2. **Démarrage des services** :
   - Télécharge le fichier `docker-compose.yaml` depuis le dépôt.
   - Lance les services définis avec Docker Compose.
3. **Vérification des conteneurs** :
   - Vérifie que les conteneurs sont en cours d'exécution et fonctionnent correctement.

## Vérification du déploiement

Une fois le playbook exécuté, Ansible :
1. Installe Docker et ses dépendances.
2. Télécharge et configure le projet.
3. Lance les services avec Docker Compose.
4. Vérifie que les services sont accessibles localement.

Pour tester l'application, utilisez la commande suivante :
```bash
curl http://localhost:8080
```
Un code de réponse `200 OK` indiquera que le déploiement est réussi.

---

## Résumé

Le déploiement avec **Ansible** simplifie la gestion des configurations et l'installation des dépendances nécessaires pour le projet **ÉvalueTonSavoir**. Avec cette méthode, vous pouvez déployer rapidement l'application dans un environnement local tout en assurant une configuration cohérente.
