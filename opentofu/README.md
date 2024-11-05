# Déploiement avec Opentofu

## Microsoft Azure

### Installer opentofu

https://opentofu.org/docs/intro/install/

### Installer Azure CLI

https://learn.microsoft.com/en-us/cli/azure/install-azure-cli#install

### Modifier les configurations

Créer un fichier **terraform.tfvars** sur la base du fichier **terraform.tfvars.example** dans le répertoire **azure**.
Vous pouvez changer toutes les variables utilisée lors du déploiement dans ce fichier.
Toutes les variables, leur description et leur valeur par défaut sont disponibles dans le fichier **variables.tf**.

Créer un fichier **auth_config.json** sur la base du fichier **auth_config.json.example** dans le répertoire **opentofu**.

Modifier le fichier **default.conf** afin de pointer vers le bon url pour le backend et le frontend.
L'url du frontend est défini comme suit: http://\<container_group_app_dns>.\<location>.azurecontainer.io:\<frontend_port>".
L'url du backend est défini comme suit: http://\<container_group_app_dns>.\<location>.azurecontainer.io:\<backend_port>".
Location est sans espace et en minuscule.
Par défaut, l'url du frontend est http://evaluetonsavoir-app.canadacentral.azurecontainer.io:5173.
Par défaut, l'url du backend est http://evaluetonsavoir-app.canadacentral.azurecontainer.io:3000.

### Lancer le déploiement

Pour lancer le déploiement, faites les commandes suivantes

`cd azure`  
`az login`  
`tofu init`  
`tofu apply`  

Ensuite, opentofu va afficher toutes les actions qu'il va effectuer avec les valeurs configurées.
Entrez `yes` pour appliquer ces actions et lancer le déploiement.

