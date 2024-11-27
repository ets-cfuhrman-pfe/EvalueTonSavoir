> [!NOTE]
> Chaque projet contient un fichier `.env.example` fournissant des exemples de configuration. Assurez-vous de consulter ce fichier pour vous inspirer des paramètres nécessaires à votre configuration.

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
