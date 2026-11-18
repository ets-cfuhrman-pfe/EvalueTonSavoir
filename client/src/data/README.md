# Notes de version « Nouveautés »

Le fichier `whatsNew.json` est la seule source des notes affichées aux enseignants dans le
panneau **Nouveautés** de la barre de navigation. Il est inclus dans l'image Docker du client.
Les notes sont en français seulement et s'adressent aux enseignants, pas aux développeurs.

## Format

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
        { "description": "Une phrase qui dit ce qui fonctionne maintenant correctement." }
      ]
    }
  ]
}
```

- `area` doit être l'une des valeurs suivantes : `Éditeur`, `Quiz en direct`,
  `Tableau de bord`, `Impression`, `Connexion`, `Navigation`, `Préférences`, `Autre`.
- Chaque version doit contenir au moins une nouveauté (`features`) ou une correction (`fixes`).
- Tous les textes doivent être non vides et rédigés en français.
- Une version ne peut apparaître qu'une seule fois.

## Comment les notes sont produites

Les notes sont écrites au moment de la création d'un RC, par le workflow
**Release - Create Staging Release (RC)** (`.github/workflows/release-create-rc.yml`) lancé
sur `staging` avec `package: client`. L'option `release_notes` choisit la méthode :

| Option | Comportement |
| --- | --- |
| `auto` (par défaut) | Si une entrée `"unreleased"` existe, elle est utilisée (voir plus bas). Sinon, l'IA (GitHub Models) rédige les notes à partir des commits touchant `client/` depuis la dernière version en production. Si l'IA échoue ou répond quelque chose d'invalide, le RC continue sans nouvelles notes (avertissement dans le résumé du workflow). |
| `manual` | Une entrée `"unreleased"` est obligatoire. Sans elle, le workflow échoue **avant** tout commit ou push. |
| `none` | Le fichier n'est pas modifié. |

Dans les deux premiers cas, l'entrée reçoit le numéro de version (sans le suffixe `-rc.N`) et
la date du jour, puis elle est incluse dans le commit de version et dans l'image du RC.
Le résumé du workflow affiche l'entrée obtenue.

Relancer un RC pour la même version (ex. `-rc.1`) remplace l'entrée de cette version au lieu
d'en ajouter une deuxième. Attention : en mode `auto`, l'IA réécrit alors les notes. Pour garder
des notes déjà corrigées à la main, relancez avec `release_notes: manual` (les notes existantes
de la version sont conservées) ou `none`.

Pour voir ce que l'IA produirait sans rien modifier, lancez le workflow
**Nouveautés - Preview release notes** (`.github/workflows/whats-new-preview.yml`).

## Écrire les notes à la main

1. Dans une PR vers `staging`, ajoutez une entrée `"unreleased"` **en haut** de `releases`
   (la date est facultative, elle sera ajoutée automatiquement) :

   ```json
   {
     "releases": [
       {
         "version": "unreleased",
         "features": [
           {
             "area": "Quiz en direct",
             "title": "…",
             "description": "…"
           }
         ],
         "fixes": [
           { "description": "…" }
         ]
       },
       { "version": "2.5.0", "…": "entrées existantes inchangées" }
     ]
   }
   ```

2. Une fois la PR fusionnée, lancez le RC avec `release_notes: manual` (ou `auto`, qui utilise
   aussi l'entrée `"unreleased"` en priorité et n'appelle pas l'IA).

Il ne peut y avoir qu'une seule entrée `"unreleased"`.

## Conseils de rédaction

- Écrivez pour un enseignant : ce qu'il peut faire de nouveau, ou ce qui ne le dérange plus.
- Une phrase par description, au vouvoiement, sans jargon technique.
- Regroupez les changements liés ; omettez les tests, la refonte de code et l'intégration continue.

## Corriger le texte avant la mise en production

Après le RC, relisez `whatsNew.json` dans la PR `staging` → `main`. Si une formulation ne
convient pas, modifiez le fichier directement dans cette PR (ou dans une petite PR vers
`staging` avant de l'ouvrir). La promotion vers la production
(`release-promote-rc.yml`) ne touche pas ce fichier : ce qui est fusionné dans `main` est
exactement ce que verront les enseignants.

## Développement

Le script et ses tests se trouvent dans `.github/scripts/whats-new/` :

```bash
node --test .github/scripts/whats-new/update-whats-new.test.mjs
node .github/scripts/whats-new/update-whats-new.mjs --mode manual --version 2.6.0-rc.0 --dry-run
node .github/scripts/whats-new/update-whats-new.mjs --collect-commits
```
