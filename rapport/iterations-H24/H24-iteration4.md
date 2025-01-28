# Plan d'itération 4

## Étapes jalons

| Étape jalon                                       | Date       |
| :------------------------------------------------ | :--------- |
| Début de l'itération                              | 2024/03/29 |
| Démo de l'application et révision des user cases  | 2024/04/09 |
| Fin de l'itération                                | 2024/04/11 |

## Objectifs clés

Les objectifs clés de cette itération sont les suivants:

-   Terminer la migration du serveur
-   Régler le problème d'affichage
-   Terminer les manipulations entourant les dossiers


## Affectations d'éléments de travail

| Nom / Description              | Priorité | [Taille estimée (points)](#commentEstimer 'Comment estimer?') | Assigné à (nom) | Documents de référence                                                                          |
| ------------------------------ | -------: | ------------------------------------------------------------: | --------------- | ----------------------------------------------------------------------------------------------- |
| Migration du serveur |        1 |                                                             4 | Samy, Louis          ||
| Changer de dossier à la création|   2|                                      2| Mathieu          ||
| Déplacer les quizs dans un dossier|   2|                                      3| Mathieu         |                                                 |
| Copier coller à partir de questions|   3|                                      2| Mathieu        |                                                 |
| Problèmes d'affichage GIFT |   2|                                      3| Mélanie         |                                                 |

## Problèmes principaux rencontrés

| Problème                                                                                                                               | Notes                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| |                                                                                                                                                                     |
| |                                                                                                               |

## Critères d'évaluation

> Une brève description de la façon d'évaluer si les objectifs (définis plus haut) de haut niveau ont été atteints.
> Vos critères d'évaluation doivent être objectifs (aucun membre de l'équipe ne peut avoir une opinion divergente) et quantifiables (sauf pour ceux évalués par l'auxiliaire d'enseignement). En voici des exemples:

-   Serveur accessible et déploiement automatisé
-   Affichage des questions normalisé
-   Fonctionnalités entourant les dossiers mises en place

## Évaluation

| Résumé             |                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Cible d'évaluation | Itération                                                                                                                          |
| Date d'évaluation  | 2024/04/09                                                                                                                        |
| Participants       | **Équipe** : Louis-Antoine Caron, Samy Waddah, Mathieu Roy, Mélanie St-Hilaire<br> **professeur** : Christopher Fuhrman |
| État du projet     | 🟢                                                                                                                                 |

### Éléments de travail: prévus vs réalisés

Le nouveau serveur est déployé et fonctionnel, mais il reste à communiquer avec le STI pour configurer le nom DNS du site pour ne pas avoir à utiliser l'adresse ip du serveur. Le déploiement automatique via les github actions est mis en place, les mises à jour se feront à 5h du matin s'il y a un changement au code principal. Plusieurs fonctionnalités entourant les dossiers comme le déplacement ou la sélection du dossier à la création initiale ont été ajoutés. Copier une question directement dans l'éditeur a été ajouté et la section d'affichage de questions utilise maintenant le même module que l'éditeur, corrigeant le problème d'affichage.

### Évaluation par rapport aux résultats selon les critères d'évaluation

Les critères de cette itération ont été atteint, le projet est maintenant disponible sur un serveur permanent et se déploie automatiquement au besoin. L'affichage est maintenant uniformisé et les quiz peuvent être déplacés entre les dossiers sans problème.

## Autres préoccupations et écarts


