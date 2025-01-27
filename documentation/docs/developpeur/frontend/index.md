## À Propos

Ce projet représente une interface utilisateur React pour notre application.

## GIFT text format render (code source)

Le code original a été développé pour créer une extension VS afin de prendre en charge le format de texte GIFT.

Le code peut être trouvé ici: [https://codesandbox.io/s/gift-templates-iny09](https://codesandbox.io/s/gift-templates-iny09)

Nous avons décidé de réutiliser ce code car il fournit un aperçu proche de ce à quoi ressemblent les quiz dans Moodle, 
étant une plateforme bien connue à l'École de Technologie Supérieure (ÉTS).

Pour réutiliser le code, nous avons dû installer les packages NPM suivants:

-   [katex](https://www.npmjs.com/package/katex) : Une bibliothèque JavaScript rapide et facile à utiliser pour le rendu mathématique TeX sur le web.
-   [marked](https://www.npmjs.com/package/marked) : Un analyseur syntaxique et un compilateur de markdown construit pour la vitesse.
-   [nanoid](https://www.npmjs.com/package/nanoid) : Un générateur d'identifiants de chaîne unique, sécurisé, convivial pour les URL et minuscule (108 octets) pour JavaScript.
-   [gift-pegjs](https://www.npmjs.com/package/gift-pegjs) : Un analyseur GIFT pour JavaScript utilisant PEG.js.
-   [@types/katex](https://www.npmjs.com/package/@types/katex) : Définitions TypeScript pour katex.
-   [@types/marked](https://www.npmjs.com/package/@types/marked) : Définitions TypeScript pour marked.
-   [@types/nanoid](https://www.npmjs.com/package/@types/nanoid) : Définitions TypeScript pour nanoid.
