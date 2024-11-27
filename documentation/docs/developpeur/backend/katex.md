# KaTeX

KaTeX est le module qui s'occupe de formater les formules mathématiques selon la configuration donnée.

Les formules entourées de $$ s'afficheront centrées sur leur propre ligne 

`.replace(/\$\$(.*?)\$\$/g, (_, inner) => katex.renderToString(inner, { displayMode: true }))`

alors que les formules entourées de $ s'afficheront sur la même ligne

`.replace(/\$(.*?)\$/g, (_, inner) => katex.renderToString(inner, { displayMode: false }))`

La configuration du formatage peut être trouvée dans le fichier TextType.ts situé dans le dossier EvalueTonSavoir/client/src/components/GiftTemplate/templates

C'est aussi dans ce fichier que le format markdown est pris en charge.

## Éditeur de quiz
Pour l'affichage dans l'éditeur de quiz, on peut retrouver la classe TextType être appliquée sur différents éléments du dossier templates, par exemple la classe Numerical.ts.

On peut voir ici que le TextType est appliqué sur le contenu de la question:
```typescript
<p style="${ParagraphStyle(state.theme)}">${TextType({text: stem })}</p>
```

Selon ce qui avait été écrit dans la question, la classe s'occupera de formatter les bonnes sections.

## Affichage de questions

Le module React-latex était utilisé pour le formatage des questions durant un quiz, mais cela a apporté le problème de disparité d'affichage entre la création et l'affichage des questions avec des formules mathématiques.
Les classes affichant les questions durant un quiz peuvent utiliser ce format, mais avec une manipulation de plus.

Les variables contenant la question doivent d'abord avoir un type TextFormat pour pouvoir faire appel à la classe qui s'occupe du format sous le module KaTeX.
Puis, étant sur un environnement React, il faut utiliser la propriété dangerouslySetInnerHTML pour afficher la question correctement.


`<div dangerouslySetInnerHTML={{ __html: TextType({text: questionContent}) }} />
            `

Ce type de manipulation peut être utilisé dans d'autre environnement React si on veut éviter d'utiliser React-latex.