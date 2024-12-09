# Déploiement avec Opentofu

## Microsoft Azure

### Installer opentofu

https://opentofu.org/docs/intro/install/

### Installer Azure CLI

https://learn.microsoft.com/en-us/cli/azure/install-azure-cli#install

### Se connecter à Azure et récupérer l'id de l'abonnement Azure

Pour se connecter à Azure, faites la commande suivante

`az login`

Avec cette commande, vous allez sélectionner un abonnement Azure. Copiez l'id de l'abonnement, vous en aurez besoin
dans l'étape suivant.

### Modifier les configurations

Créer un fichier **terraform.tfvars** sur la base du fichier **terraform.tfvars.example** dans le répertoire **azure**.
Vous pouvez changer toutes les variables utilisée lors du déploiement dans ce fichier.
Toutes les variables, leur description et leur valeur par défaut sont disponibles dans le fichier **variables.tf**.

Créer un fichier **auth_config.json** sur la base du fichier **auth_config.json.example** dans le répertoire **opentofu**.

L'url est défini comme suit: http://<container_group_app_dns>.<location>.cloudapp.azure.com.
Par défaut, l'url est http://evaluetonsavoir.canadacentral.cloudapp.azure.com/

### Lancer le déploiement

Pour lancer le déploiement, faites les commandes suivantes

`cd azure`  
`az login`  
`tofu init`  
`tofu apply`  

Ensuite, opentofu va afficher toutes les actions qu'il va effectuer avec les valeurs configurées.
Entrez `yes` pour appliquer ces actions et lancer le déploiement.

