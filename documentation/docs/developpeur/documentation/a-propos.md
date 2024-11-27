# A propos

## Lancer la documentation
Pour lancer la documentation, il faut installer python et entrer dans le dossier documentation.
Il faut ensuite installer les dépendances avec `pip install -r requirements.txt`.
Pour lancer le mode développement il faut executer `python -m mkdocs serve`
Afin d'accellerer le déploiement et ne pas être touché par des érreurs de "rate-limiting", il est préférable d'utiliser une image docker de plantuml. Pour cela, il faut utiliser la commande suivante : `docker run -d --name plantuml -p 8080:8080 plantuml/plantuml-server:tomcat`

## Deploiement
Le code est automatiquement déployé par la github-action `create-docs.yaml`
Celle-ci ouvre le repo et fait les memes étapes que "lancer la documentation".
Il y a une différence, elle utilise `build` au lieu de `serve` pour ensuite publier avec l'outil [`ghp-import`](https://github.com/c-w/ghp-import).
La page est poussée sur la branche [`gh-pages`](https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/tree/gh-pages) et ensuite publié en tant que [gh-page](https://pages.github.com/)

## Themes et Plugins
Si vous ajoutez des plugins, veuillez mettre a jour le fichier `requirements.txt`.

La documentation utilise [MkDocs](https://www.mkdocs.org/) avec [le theme matérial]((https://squidfunk.github.io/mkdocs-material/)). Il y a bien des fonctionalitées tel que les code-blocks qui peuvent être activés.
Vous pouvez avoir accès a la documentation ici : [https://squidfunk.github.io/mkdocs-material/reference/code-blocks/](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/)

## Autre méthode de lancement (virtuel)
Si vous avez un probleme avec votre environement et vous avez besoin d'un environement virtuel, il s'agit de faire `python -m venv .venv` dans le dossier document et d'activer cet environemment avec le fichier activate (changeant depedant de votre invite de commande) : `.venv\script\activate`
vous pouvez ensuite continuer les autres étapes.