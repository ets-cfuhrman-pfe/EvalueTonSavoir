# Plan d'itération 2

## Étapes jalons

| Étape jalon                                       | Date       |
| :------------------------------------------------ | :--------- |
| Début de l'itération                              | 2024/02/08 |
| Démo de l'application et révision des user cases  | 2024/02/27 |
| Fin de l'itération                                | 2024/02/29 |

## Objectifs clés

Les objectifs clés de cette itération sont les suivants:

-   Configurer le serveur pour héberger la solution
-   Configurer la base de données pour permettre la sauvegarde des quizs sur le serveur
-   Implémenter le téléversement d'image dans les quizs
-   Corriger certains bugs


## Affectations d'éléments de travail

| Nom / Description              | Priorité | [Taille estimée (points)](#commentEstimer 'Comment estimer?') | Assigné à (nom) | Documents de référence                                                                          |
| ------------------------------ | -------: | ------------------------------------------------------------: | --------------- | ----------------------------------------------------------------------------------------------- |
| Création d'un serveur |        1 |                                                             4 | Samy, Mélanie            ||
| Sauvegarde de quiz création BD |  1|                                                        4 | Mathieu, Louis           ||
| Connexion d'un étudiant à un quiz en cours|   1|                                      4| Mathieu, Louis          ||
| Upload d'images directement dans un quiz|   1|                                      3| Louis          |                                                 |
| Bug: perte de connexion  |   2|                                      1| Mathieu, Louis          |                                                 |
| Bug commentaires  |   2|                                      1| Mélanie         |                                                 |

## Problèmes principaux rencontrés

| Problème                                                                                                                               | Notes                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La section de GIFT pour la création des quizs ne semble plus prendre le code normalement comme avant. Un simple commentaire seul sera pris comme du texte normal et certains bout de codes ne fonctionnent pas correctement s'il n'y a pas une entrée avant.| Investigation en cours pour trouver ce qui ne fonctionne pas                                                                                                                                                                    |
| Difficulté à mettre en place le microservice pour la gestion des images. API mis en place pour la gestion des images dans le backend|                                                                                                               |

## Critères d'évaluation

> Une brève description de la façon d'évaluer si les objectifs (définis plus haut) de haut niveau ont été atteints.
> Vos critères d'évaluation doivent être objectifs (aucun membre de l'équipe ne peut avoir une opinion divergente) et quantifiables (sauf pour ceux évalués par l'auxiliaire d'enseignement). En voici des exemples:

-   Accessibilité du serveur
-   Disponibilité des images pour les quizs
-   Modification du processus de connexion pour répondre aux cas utilisateurs

## Évaluation

| Résumé             |                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Cible d'évaluation | Itération                                                                                                                          |
| Date d'évaluation  | 2024/02/27                                                                                                                        |
| Participants       | **Équipe** : Louis-Antoine Caron, Samy Waddah, Mathieu Roy, Mélanie St-Hilaire<br> **professeur** : Christopher Fuhrman |
| État du projet     | 🟢                                                                                                                                 |

### Éléments de travail: prévus vs réalisés

Le serveur a été configuré et la solution est présentement déployée pour débuter l'utilisation en classe. Cela permettra entre autre de tester les performances du serveur et permettra aux professeurs d'utiliser plus souvent la solution. Les quizs sont désormais sauvegardés sur le serveur, mais ils ne sont pas encore associés à un compte, il faut donc se fier au cookies pour récupérer les quizs. Les commentaires ont été temporairement corrigés en majorité, mais quelques problèmes de plus ont été apperçu dans la section d'édition du quiz. Le bug de perte de connexion semble avoir déja été corrigé par l'ancienne équipe et l'importation d'image dans les quiz est maintenant fonctionnelle.

### Évaluation par rapport aux résultats selon les critères d'évaluation

Nos principaux critères d'éavaluation ont été atteints, soit rendre le serveur accessible pour utilisation et autoriser l'importation d'images dans les quizs, qui sont maintenant sauvegardés sur le serveur. Même si de nouveaux problèmes ont fait surfaces, nous estimons que le projet répond à nos critères et est sur la bonne voie.

## Autres préoccupations et écarts

Quelques bugs en plus ont été découverts à la suite de cette itération. Une surveillance doit être effectué pour vérifier la stabilité du serveur.
