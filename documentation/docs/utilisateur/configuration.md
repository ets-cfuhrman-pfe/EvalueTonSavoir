> [!NOTE]
> Chaque projet contient un fichier `.env.example` fournissant des exemples de configuration.
> Assurez-vous de consulter ce fichier pour vous inspirer des paramètres nécessaires à votre configuration.

> [!NOTE]
> Ce sont toutes les options de configuration. N'hésitez pas à ouvrir une PR si vous en voyez qui manquent.

## Options de Configuration Backend

| Variable d'Environnement | Description | Exemple | Optionnel |
|---|---|---|---|
| `PORT` | Le port sur lequel l'application fonctionne | 4400 | non|
| `MONGO_URI` | La chaîne de connexion pour se connecter à la base de données mongodb | `mongodb://localhost:27017` or `mongodb://127.0.0.1:27017` (the former can cause trouble on Windows depending on hosts files) | non|
| `MONGO_DATABASE` | Le nom souhaité pour la base de données | evaluetonsavoir | non|
| `EMAIL_SERVICE` | Le service utilisé pour les e-mails | gmail | non|
| `SENDER_EMAIL` | L'adresse e-mail utilisée pour l'envoi | monadresse@gmail.com | non|
| `EMAIL_PSW` | Le mot de passe de l'adresse e-mail | 'monmotdepasse' | non|
| `JWT_SECRET` | Le secret utilisé pour la gestion des JWT | monsecretJWT | non|
| `FRONTEND_URL` | URL du frontend, y compris le port | http://localhost:5173 | non|

## Options de Configuration Frontend

| Variable d'Environnement | Description | Exemple | Optionnel |
|---|---|---|---|
| `VITE_BACKEND_URL` | URL du backend, y compris le port | http://localhost:4400 | non|
| `VITE_AZURE_BACKEND_URL` | URL du backend, y compris le port | http://localhost:4400 | non|

## Options de Configuration du routeur
| Variable d'Environnement | Description | Exemple | Optionnel défaut |
|---|---|---|---|
| `PORT` | Numero de port sur lequel la NGINX écoute | http://localhost:80 | oui|
| `FRONTEND_HOST` | Url relié au Frontend | http://localhost |oui
| `FRONTEND_PORT` | Port relié au Frontend | http://localhost:5173 | oui|
| `BACKEND_HOST` | Url relié au Backend | http://localhost |oui
| `BACKEND_PORT` | Port relié au Backend | http://localhost:3000 | oui|

## Options de Configuration de la salle de Quiz
| Variable d'Environnement | Description | Exemple | Optionnel défaut |
|---|---|---|---|
| `PORT` | Numero de port sur lequel la salle écoute | http://localhost:4500 | oui|
| `ROOM_ID` | Numéro de la salle | http://localhost/rooms/000000 | oui|

## HealthChecks

### Frontend
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:$${PORT} || exit 1"]
      interval: 5s
      timeout: 10s
      start_period: 5s
      retries: 6

### Backend
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:$${PORT}/health || exit 1"]
      interval: 5s
      timeout: 10s
      start_period: 5s
      retries: 6

### Salle de Quiz
    healthcheck:
      test: ["CMD", "/usr/src/app/healthcheck.sh"]
      interval: 5s
      timeout: 10s
      start_period: 5s
      retries: 6

### Routeur
    healthcheck:
      test: ["CMD-SHELL", "wget --spider http://0.0.0.0:$${PORT}/health || exit 1"]
      interval: 5s
      timeout: 10s
      start_period: 5s
      retries: 6

### MongoDb 

    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s