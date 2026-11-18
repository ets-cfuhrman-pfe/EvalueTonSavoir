# Notes de version « Nouveautés »

Le fichier `whatsNew.json` est la seule source des notes affichées aux enseignants dans le
panneau **Nouveautés** de la barre de navigation. Il est inclus dans l'image Docker du client.
Les notes sont en français seulement et s'adressent aux enseignants, pas aux développeurs.

**Vous n'avez pas à modifier ce fichier à la main** : les notes s'écrivent dans une issue GitHub,
et le workflow de release met le fichier à jour.

## Écrire les notes (dans GitHub)

1. **Issues → New issue → « Notes de version (Nouveautés) »**.
2. Remplissez les deux zones de texte, un élément par ligne :
   - **Nouvelles fonctionnalités** : `[Zone] Titre : description`
     (ex. `[Éditeur] L'aperçu suit votre curseur : La question modifiée est surlignée.`).
     Zones : `Éditeur`, `Quiz en direct`, `Tableau de bord`, `Impression`, `Connexion`,
     `Navigation`, `Préférences`, `Autre`. La zone est facultative (par défaut : `Autre`).
   - **Corrections** : une phrase par ligne.
3. Un commentaire automatique affiche un **aperçu** des notes telles que les enseignants les verront,
   ou la liste des **erreurs de format** à corriger. Il se met à jour à chaque modification de l'issue.

L'issue peut être créée et modifiée à tout moment avant la release. Il ne doit y avoir qu'une seule
issue « Notes de version » ouverte à la fois.

## Publier les notes (workflow de release)

Lancez **Release - Create Staging Release (RC)** (`.github/workflows/release-create-rc.yml`) sur
`staging` avec `package: client` :

| Option | Comportement |
| --- | --- |
| `release_notes: issue` (par défaut) | Les notes de l'issue ouverte avec l'étiquette `notes-de-version` (ou de l'issue indiquée dans `notes_issue`) sont ajoutées à `whatsNew.json` avec le numéro de version (sans `-rc.N`) et la date du jour, puis incluses dans le commit de version et l'image du RC. Après le push, un commentaire est ajouté à l'issue et elle est fermée. |
| `release_notes: none` | Aucune note pour cette release (ex. mise à jour purement technique). Le fichier n'est pas modifié. |

Le workflow échoue **avant** tout commit ou push si :
- aucune issue « Notes de version » n'est ouverte (et la version n'a pas déjà des notes) ;
- plusieurs issues sont ouvertes (précisez alors `notes_issue`) ;
- l'issue contient des erreurs de format.

Le résumé du workflow affiche les notes publiées.

## Corriger les notes après un RC

Modifiez le texte de l'issue (même fermée), puis relancez le RC avec `notes_issue: <numéro>` :
les notes de la version sont remplacées. Relancer un RC **sans** issue ouverte conserve les notes
déjà publiées pour cette version.

La promotion vers la production (`release-promote-rc.yml`) ne touche pas ce fichier : ce qui est
fusionné dans `main` est exactement ce que verront les enseignants.

## Format du fichier (référence)

Les versions sont listées de la plus récente à la plus ancienne.

```json
{
  "releases": [
    {
      "version": "2.5.0",
      "date": "2026-11-13",
      "features": [
        {
          "area": "Éditeur",
          "title": "Titre court de la nouveauté",
          "description": "Une phrase qui explique ce que l'enseignant y gagne."
        }
      ],
      "fixes": [
        {
          "description": "Une phrase qui dit ce qui fonctionne maintenant correctement."
        }
      ]
    }
  ]
}
```

## Conseils de rédaction

- Écrivez pour un enseignant : ce qu'il peut faire de nouveau, ou ce qui ne le dérange plus.
- Une phrase par description, au vouvoiement, sans jargon technique.
- Regroupez les changements liés ; omettez les tests, la refonte de code et l'intégration continue.
- Pour savoir quoi écrire, consultez les PR fusionnées depuis la dernière version, par exemple :
  `git log client-v2.5.0..staging --merges --oneline`.

## Configuration requise (une seule fois)

- L'étiquette **`notes-de-version`** doit exister dans le dépôt (Issues → Labels).
- Le formulaire d'issue et le workflow de vérification (`whats-new-issue-check.yml`) ne sont actifs
  qu'une fois présents sur la branche par défaut du dépôt (`staging`).

## Développement

Le script et ses tests se trouvent dans `.github/scripts/whats-new/` :

```bash
node --test .github/scripts/whats-new/update-whats-new.test.mjs
node .github/scripts/whats-new/update-whats-new.mjs --check --issue-body issue.md
node .github/scripts/whats-new/update-whats-new.mjs --mode issue --version 2.6.0-rc.0 --issue-body issue.md --dry-run
```
