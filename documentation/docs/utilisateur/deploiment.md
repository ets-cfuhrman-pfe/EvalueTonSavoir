# Déploiement

Les méthodes recommandées de déploiement sont via Ansible et Opentofu.
Ansible est utilisés afin de faire un déploiement sur un serveur local, opentofu sur le cloud.

## Ansible

Le déploiement avec ansible est un déploiement simplifié.
Il vous suffit d'avoir un ordinateur linux/mac ou pouvant faire exécuter [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 
dans le cas de windows. Il faut ensuite utiliser le gestionnaire de paquet (souvent apt) afin d'installer 
le paquet `ansible-core`, d'autres méthodes sont indiquées dans la [documentation officielle de ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html).
Une fois le tout fait, vous pouvez telécharger [les fichiers nécéssaire](https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/ansible) et lancer la commande 
`ansible-playbook -i inventory.ini deploy.yml`

## OpenTofu
Le déploiement avec OpenTofu est un peu plus complexe mais il permet d'héberger la solution sur votre cloud préféré.
Il suffit [d'installer OpenTofu](https://opentofu.org/docs/intro/install/) et de téléchgarger [les fichiers nécéssaires](https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/opentofu). 
Un Readme est inclus afin d'organiser votre grappe de serveurs.