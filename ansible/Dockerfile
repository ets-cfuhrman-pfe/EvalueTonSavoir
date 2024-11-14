FROM python:3.9-slim

# Installer Ansible
RUN pip install ansible

# Définir le répertoire de travail
WORKDIR /ansible

# Copier les fichiers nécessaires
COPY inventory.ini deploy.yml ./
