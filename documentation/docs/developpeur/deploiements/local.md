## Prérequis

- Assurez-vous d'avoir Node JS installé en téléchargeant la dernière version depuis [https://nodejs.org/en](https://nodejs.org/en).

- Ensuite, assurez-vous d'avoir accès à un serveur MongoDB de développement

> Pour plus d'informations sur la base de données, veuillez consulter la documentation [[ici|Base-de-données]]

- Cloner le projet avec la commande suivante : 
   ```
   git clone https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir.git
   ```

## Étape 1 - démarrage du backend

1. Naviguez vers le répertoire du projet en utilisant la commande suivante :
   ```
   cd .\EvalueTonSavoir\server\
   ```

2. Assurez-vous de créer le fichier .env et d'y ajouter les paramètres appropriés. Vous pouvez vous inspirer du fichier .env.example pour connaître les paramètres nécessaires.
   
   [[Voir ici la documentation des configurations|Configurations]]

3. Installez les dépendances avec la commande suivante :
   ```
   npm install
   ```

4. Démarrez le serveur en utilisant la commande suivante :
   ```
   npm run dev
   ```

5. Ouvrez votre navigateur et accédez à l'URL indiquée dans la console (par exemple, http://localhost:4400).

## Étape 2 - Démarrage du frontend

1. Naviguez vers le répertoire du projet en utilisant la commande suivante :
   ```
   cd .\EvalueTonSavoir\client\
   ```
> [!WARNING]
> Assurez-vous que le backend est en cours d'exécution avant de démarrer le frontend. \
> Notez également l'URL du serveur pour le fichier `.env`.

2. Assurez-vous de créer le fichier .env et d'y ajouter les paramètres appropriés. Vous pouvez vous inspirer du fichier .env.example pour connaître les paramètres nécessaires.
   
   [[Voir ici la documentation des configurations|Configurations]]

3. Installez les dépendances avec la commande suivante :
   ```
   npm install
   ```

4. Démarrez le frontend avec la commande suivante :
   ```
   npm run dev
   ```

5. Ouvrez votre navigateur et accédez à l'URL indiquée dans la console (par exemple, http://localhost:5173/).
