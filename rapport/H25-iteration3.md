# Plan d'itération 2

## Étapes jalons

| Étape jalon                                       | Date       |
| :------------------------------------------------ | :--------- |
| Début de l'itération                              | 2025/01/28 |
| Première rencontre avec les promoteurs            | 2025/01/28 |
| Démo de l'application et révision des user cases  | 2025/02/10 |
| Fin de l'itération                                | 2025/02/11 |

## Objectifs clés

Les objectifs clés de cette itération sont les suivants:

-   Démontrer des maquettes pour la création d'équation facile, modernisation de l'interface de la page professeur et le tableau des résultats en temps réel. 
-   Démontrer le SSO fonctionnel en production
-   Démontrer la fonctionnalité d'exporter un Quiz en PDF
-   Démontrer un exemple d'affichage de pourcentage entre chaque question
-   Démontrer la fonction de copier/coller une question en utilisant le bouton
-   Démontrer l'ajout d'indices aux questions
-   Démontrer la fonctionnalité d'avoir un code permanent pour les salles de quiz



## Affectations d'éléments de travail

| Nom / Description              | Priorité | [Taille estimée (points)](#commentEstimer 'Comment estimer?') | Assigné à (nom) | Documents de référence                                                                          |
| ------------------------------ | -------: | ------------------------------------------------------------: | --------------- | ----------------------------------------------------------------------------------------------- |
| SSO en production |        1 |                                                             4 | Edwin            ||
| Maquette figma pour création d'équation facile |  1|                                                        1 | Ana            ||
| Maquette figma pour modernisation de la page professeur |  2|                                                        1 | Ana            ||
| Maquette figma du tableau des résultats en temps réel |  2|                                                        1 | Ana            ||
| Fonction Quiz à PDF |   2|                                      2| Philippe         |                                                 |
| Ajout d'indices aux questions          |   1|                                      1| Nouhaila         |   
| Code permanent pour les salles          |   2|                                      1| Nouhaila         |                                                 |
| Affichage d'un pourcentage de participation et de bonne réponse               |   3|                                      3| Kendrick    |                                                 |

## Problèmes principaux rencontrés

| Problème                                                                                                                               | Notes                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge de la fonctionnalité SSO |  Reporté à la prochaine itération       
| Fonctionnalité déjà implémenté |  Copier-collé fonctionnait, problème de communication   
| Gestion des tokens |  Dette technique au niveau de la gestion des tokens ce qui bloque notre avancement   
| Accès au serveur de Production |  Nous avons pas accès au serveur de production, ce qui ralentit la mise en production de nos changements puisque nous dépendons sur Christopher                                      

## Critères d'évaluation

> Une brève description de la façon d'évaluer si les objectifs (définis plus haut) de haut niveau ont été atteints.
> Vos critères d'évaluation doivent être objectifs (aucun membre de l'équipe ne peut avoir une opinion divergente) et quantifiables (sauf pour ceux évalués par l'auxiliaire d'enseignement). En voici des exemples:

-   La branche main est fonctionnelle avec les changements de l'équipe précédente
-   Être capable d'exporter un Quiz en PDF sans avoir les rétroactions
-   Le bouton copier/coller fonctionne pour les templates de questions lors de la création d'un quiz
-   Être capable de consulter le taux de participation par questions 
- Être capable d'ajouter un indice à une question

## Évaluation

| Résumé             |                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Cible d'évaluation | Itération                                                                                                                          |
| Date d'évaluation  | 2025/02/11                                                                                                                        |
| Participants       | **Équipe** : Philippe Côté, Nouhaila Aater, Ana Lucia Munteanu, Kendrick Chan Hing Wah, Edwin Stanley Lopez Andino <br> **professeur** : Christopher Fuhrman et Alexandra Nemery |
| État du projet     | 🟢                                                                                                                                 |

### Éléments de travail: prévus vs réalisés

Déploiement du SSO avait été prévu, mais n'a pas pu être réalisé.

Fonctionnalité copier-coller était déjà fonctionnelle.



### Évaluation par rapport aux résultats selon les critères d'évaluation

Nous avons eu des bon retours sur le travaille global.
Branche main est encore fonctionelle, la branche avec tout nos merge est disponible.
La fonctionnalité du PDF et la façcon de l'utiliser est accepté.
Bouton copier/coller était déjà fonctionelle
Le taux de participation a été bien reçu, les commentaires sont surtout au niveau du UI, taux de particpation au haut de la page.
Le fonction d'ajouter des indices est à retravailler, les indices devrait être affiché du côté étudiant et enseignant.


## Autres préoccupations et écarts

L'intégration du SSO en production est plus compliqué
