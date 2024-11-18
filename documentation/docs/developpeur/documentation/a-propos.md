# A propos

## Lancer la documentation
Pour lancer la documentation, il faut installer python et entrer dans le dossier documentation.
Il faut ensuite installer les dépendances avec `pip install -r requirements.txt`.
Pour lancer le mode développement il faut executer `python -m mkdocs serve`

## Deploiement
Le code est automatiquement déployé par la github-action `create-docs.yaml`
Celle-ci ouvre le repo et fait les memes étapes que "lancer la documentation".
Il y a une différence, elle utilise `build` au lieu de `serve` pour ensuite publier avec l'outil [`ghp-import`](https://github.com/c-w/ghp-import).
La page est poussée sur la branche [`gh-pages`](https://github.com/ets-cfuhrman-pfe/EvalueTonSavoir/tree/gh-pages) et ensuite publié en tant que [gh-page](https://pages.github.com/)

## Themes et Plugins
Si vous ajoutez des plugins, veuillez mettre a jour le fichier `requirements.txt`.

La documentation utilise [MkDocs](https://www.mkdocs.org/) avec [le theme matérial]((https://squidfunk.github.io/mkdocs-material/)). Il y a bien des fonctionalitées tel que les code-blocks qui peuvent être activés.
Vous pouvez avoir accès a la documentation ici : [https://squidfunk.github.io/mkdocs-material/reference/code-blocks/](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/)