# Test de Charge - EvalueTonSavoir

Ce conteneur permet d'exécuter des tests de charge sur l'application EvalueTonSavoir.

## Prérequis

- Docker
- Docker Compose

## Configuration

1. Créez un fichier `.env` à partir du modèle `.env.example`:

```bash
copy .env.example .env
```

2. Modifiez les variables dans le fichier .env:

```bash
# URL de l'application cible
BASE_URL=http://votre-url.com

# Compte de connexion
USER_EMAIL=admin@admin.com 
USER_PASSWORD=admin

# Paramètres du test de charge
NUMBER_ROOMS=5           # Nombre de salles à créer
USERS_PER_ROOM=60       # Nombre d'utilisateurs par salle

```
#### Paramètres optionnels
Dans le fichier .env, vous pouvez aussi configurer:

```bash
MAX_MESSAGES_ROUND=20         # Messages maximum par cycle
CONVERSATION_INTERVAL=1000    # Intervalle entre les messages (ms)
MESSAGE_RESPONSE_TIMEOUT=5000 # Timeout des réponses (ms)
BATCH_DELAY=1000             # Délai entre les lots (ms)
BATCH_SIZE=10                # Taille des lots d'utilisateurs
```

## Démarrage
Pour lancer le test de charge:

Les résultats seront disponibles dans le dossier output/.

```bash
docker compose up
```
