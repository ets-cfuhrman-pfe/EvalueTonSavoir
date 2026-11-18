#!/usr/bin/env node
// Met à jour client/src/data/whatsNew.json au moment d'une release (RC), à partir
// d'une issue GitHub « Notes de version » (.github/ISSUE_TEMPLATE/notes-de-version.yml).
// Plain Node, aucune dépendance.
//
// Usage:
//   node update-whats-new.mjs --mode issue|none --version X.Y.Z-rc.N
//        [--issue-body <fichier>] [--file client/src/data/whatsNew.json]
//        [--summary <fichier>] [--dry-run] [--date YYYY-MM-DD]
//   node update-whats-new.mjs --check --issue-body <fichier>
//
// Modes:
//   issue   Le corps de l'issue (--issue-body) est converti en entrée pour la version
//           (sans le suffixe -rc.N) et la date du jour (UTC). Une entrée existante pour
//           la même version est remplacée. Sans --issue-body : si la version a déjà des
//           notes (relance d'un RC), elles sont conservées ; sinon, erreur.
//   none    Rien n'est modifié.
//   --check Valide le corps de l'issue et écrit un commentaire Markdown (aperçu ou
//           erreurs) sur la sortie standard. Code 0 = valide, 2 = erreurs de format.
//
// Le corps de l'issue est une donnée non fiable : il est toujours lu depuis un
// fichier, jamais interpolé dans une commande shell.

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const DEFAULT_FILE = 'client/src/data/whatsNew.json';
export const DEFAULT_AREA = 'Autre';
export const AREAS = [
  'Éditeur',
  'Quiz en direct',
  'Tableau de bord',
  'Impression',
  'Connexion',
  'Navigation',
  'Préférences',
  'Autre',
];

export const FEATURES_HEADING = 'Nouvelles fonctionnalités';
export const FIXES_HEADING = 'Corrections';

const MAX_TEXT_LENGTH = 400;

export class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2.6.0-rc.3" -> "2.6.0", "v2.6.0" -> "2.6.0". */
export function normalizeVersion(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new UsageError('--version est requis (ex. 2.6.0-rc.0).');
  }
  const match = raw.trim().replace(/^v/, '').match(/^(\d+\.\d+\.\d+)(?:-rc\.\d+)?$/);
  if (!match) {
    throw new UsageError(`Version invalide : "${raw}" (attendu X.Y.Z ou X.Y.Z-rc.N).`);
  }
  return match[1];
}

export function todayUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function readNotes(file) {
  if (!existsSync(file)) return { releases: [] };
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new UsageError(`${file} n'est pas un JSON valide : ${err.message}`);
  }
  if (!data || !Array.isArray(data.releases)) {
    throw new UsageError(`${file} doit contenir un objet { "releases": [...] }.`);
  }
  return data;
}

export function serializeNotes(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/** Lower case, accents removed: "Éditeur" -> "editeur". */
function fold(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function checkText(value, path, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} doit être un texte non vide.`);
    return;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    errors.push(`${path} est trop long (${value.length} > ${MAX_TEXT_LENGTH} caractères).`);
  }
}

/** Validate one release entry. Returns a list of error messages (empty = valid). */
export function validateEntry(entry, { label = 'entrée' } = {}) {
  const errors = [];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${label} doit être un objet.`];
  }
  if (typeof entry.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(entry.version)) {
    errors.push(`${label}.version invalide : "${entry.version}".`);
  }
  if (entry.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date))) {
    errors.push(`${label}.date doit être au format AAAA-MM-JJ.`);
  }
  const features = entry.features ?? [];
  const fixes = entry.fixes ?? [];
  if (!Array.isArray(features)) errors.push(`${label}.features doit être une liste.`);
  if (!Array.isArray(fixes)) errors.push(`${label}.fixes doit être une liste.`);
  if (errors.length) return errors;

  if (features.length + fixes.length === 0) {
    errors.push(`${label} doit contenir au moins une nouveauté ou une correction.`);
  }
  features.forEach((f, i) => {
    const p = `${label}.features[${i}]`;
    if (!f || typeof f !== 'object') {
      errors.push(`${p} doit être un objet.`);
      return;
    }
    checkText(f.area, `${p}.area`, errors);
    if (typeof f.area === 'string' && f.area.trim() && !AREAS.includes(f.area)) {
      errors.push(`${p}.area "${f.area}" n'est pas une zone connue (${AREAS.join(', ')}).`);
    }
    checkText(f.title, `${p}.title`, errors);
    checkText(f.description, `${p}.description`, errors);
  });
  fixes.forEach((f, i) => {
    const p = `${label}.fixes[${i}]`;
    if (!f || typeof f !== 'object') {
      errors.push(`${p} doit être un objet.`);
      return;
    }
    checkText(f.description, `${p}.description`, errors);
  });

  return errors;
}

export function validateNotes(data) {
  const errors = [];
  const seen = new Set();
  data.releases.forEach((entry, i) => {
    const label = `releases[${i}]`;
    errors.push(...validateEntry(entry, { label }));
    if (entry && typeof entry.version === 'string') {
      if (seen.has(entry.version)) errors.push(`Version en double : "${entry.version}".`);
      seen.add(entry.version);
    }
  });
  return errors;
}

/** Insert or replace the entry for `entry.version`. New entries go first (newest first). */
function upsert(data, entry) {
  const releases = [...data.releases];
  const existing = releases.findIndex((r) => r.version === entry.version);
  if (existing >= 0) {
    releases[existing] = entry;
  } else {
    releases.unshift(entry);
  }
  return { ...data, releases };
}

function assertValid(data) {
  const errors = validateNotes(data);
  if (errors.length) {
    throw new UsageError(`Le fichier de notes résultant est invalide :\n- ${errors.join('\n- ')}`);
  }
}

// ---------------------------------------------------------------------------
// Issue form parsing
// ---------------------------------------------------------------------------

/**
 * Split a GitHub issue-form body ("### Heading" + answer) into its two answers.
 * Unknown headings are ignored; "_No response_" means empty.
 */
export function splitIssueSections(body) {
  const text = String(body ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '');
  const sections = { features: '', fixes: '' };
  const parts = text.split(/^###[ \t]+(.+)$/m);
  // parts = [before, heading1, content1, heading2, content2, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const heading = fold(parts[i]);
    const content = (parts[i + 1] ?? '').trim();
    const value = content === '_No response_' ? '' : content;
    if (heading.startsWith(fold(FEATURES_HEADING))) sections.features = value;
    else if (heading.startsWith(fold(FIXES_HEADING))) sections.fixes = value;
  }
  return sections;
}

function contentLines(block) {
  return block
    .split('\n')
    .map((line, index) => ({ n: index + 1, text: line.trim() }))
    .filter(({ text }) => text !== '' && !/^```/.test(text))
    .map(({ n, text }) => ({ n, text: text.replace(/^(?:[-*•]|\d+[.)])\s+/, '').trim() }))
    .filter(({ text }) => text !== '');
}

function shorten(s, max = 60) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Parse an issue-form body into { features, fixes, errors }.
 * Feature line: "[Zone] Titre : description" (zone optional, defaults to "Autre").
 * Fix line: one sentence.
 */
export function parseIssueBody(body) {
  const sections = splitIssueSections(body);
  const errors = [];
  const features = [];
  const fixes = [];
  const areaByFold = new Map(AREAS.map((a) => [fold(a), a]));

  for (const { n, text } of contentLines(sections.features)) {
    const where = `${FEATURES_HEADING}, ligne ${n} (« ${shorten(text)} »)`;
    let rest = text;
    let area = DEFAULT_AREA;
    const zone = rest.match(/^\[([^\]]*)\]\s*/);
    if (zone) {
      const known = areaByFold.get(fold(zone[1]));
      if (!known) {
        errors.push(`${where} : zone « ${zone[1]} » inconnue. Zones possibles : ${AREAS.join(', ')}.`);
        continue;
      }
      area = known;
      rest = rest.slice(zone[0].length);
    }
    const sep = rest.match(/\s*:\s+/);
    if (!sep) {
      errors.push(`${where} : il manque « : » entre le titre et la description (format : [Zone] Titre : description).`);
      continue;
    }
    const title = rest.slice(0, sep.index).trim();
    const description = rest.slice(sep.index + sep[0].length).trim();
    if (!title || !description) {
      errors.push(`${where} : le titre et la description doivent être remplis.`);
      continue;
    }
    features.push({ area, title, description });
  }

  for (const { text } of contentLines(sections.fixes)) {
    fixes.push({ description: text });
  }

  if (!errors.length && features.length + fixes.length === 0) {
    errors.push('Aucune nouveauté ni correction : remplissez au moins une des deux sections.');
  }
  if (!errors.length) {
    const lengthErrors = validateEntry({ version: '0.0.0', features, fixes }, { label: 'notes' });
    errors.push(...lengthErrors);
  }
  return { features, fixes, errors };
}

// ---------------------------------------------------------------------------
// Core update logic (pure: no I/O)
// ---------------------------------------------------------------------------

/**
 * @returns {{ changed: boolean, data: object, entry?: object, message: string }}
 * @throws {UsageError} for anything that must stop the release.
 */
export function computeUpdate(data, { mode, version, date, issueBody }) {
  if (!['issue', 'none'].includes(mode)) {
    throw new UsageError(`--mode doit être issue ou none (reçu : "${mode}").`);
  }
  if (mode === 'none') {
    return { changed: false, data, message: 'Mode "none" : aucune note de version publiée.' };
  }
  const v = normalizeVersion(version);

  if (issueBody === undefined) {
    // No issue: an RC re-run (rc.1, rc.2…) keeps the notes already published for this version.
    const existing = data.releases.find((r) => r.version === v);
    if (existing) {
      return {
        changed: false,
        data,
        entry: existing,
        message: `Aucune issue « Notes de version », mais ${v} a déjà des notes (relance d'un RC) : conservées telles quelles.`,
      };
    }
    throw new UsageError(
      `Mode "issue" : aucune issue « Notes de version » trouvée.\n` +
        `Créez-en une (New issue > Notes de version), ou relancez avec notes_issue: <numéro> ` +
        `ou release_notes: none.`,
    );
  }

  const parsed = parseIssueBody(issueBody);
  if (parsed.errors.length) {
    throw new UsageError(`L'issue « Notes de version » contient des erreurs :\n- ${parsed.errors.join('\n- ')}`);
  }
  const entry = { version: v, date, features: parsed.features, fixes: parsed.fixes };
  const replaced = data.releases.some((r) => r.version === v);
  const next = upsert(data, entry);
  assertValid(next);
  return {
    changed: true,
    data: next,
    entry,
    message: replaced
      ? `Notes de ${v} remplacées par celles de l'issue (${date}).`
      : `Notes de l'issue publiées pour ${v} (${date}).`,
  };
}

// ---------------------------------------------------------------------------
// Markdown output (job summary and issue comment)
// ---------------------------------------------------------------------------

export function previewMarkdown(features, fixes) {
  const lines = [];
  if (features.length) {
    lines.push(`**${FEATURES_HEADING}**`, '');
    for (const f of features) lines.push(`- **${f.title}** _(${f.area})_ : ${f.description}`);
    lines.push('');
  }
  if (fixes.length) {
    lines.push(`**${FIXES_HEADING}**`, '');
    for (const f of fixes) lines.push(`- ${f.description}`);
    lines.push('');
  }
  return lines.join('\n');
}

export const CHECK_MARKER = '<!-- whats-new-check -->';

export function checkComment(issueBody) {
  const { features, fixes, errors } = parseIssueBody(issueBody);
  if (errors.length) {
    return {
      ok: false,
      markdown: [
        CHECK_MARKER,
        '### ❌ Notes de version : format à corriger',
        '',
        ...errors.map((e) => `- ${e}`),
        '',
        'Modifiez l\'issue : ce commentaire se met à jour automatiquement.',
        '',
      ].join('\n'),
    };
  }
  return {
    ok: true,
    markdown: [
      CHECK_MARKER,
      '### ✅ Notes de version : aperçu',
      '',
      `${features.length} nouveauté(s) et ${fixes.length} correction(s), telles qu'elles s'afficheront aux enseignants :`,
      '',
      previewMarkdown(features, fixes),
      'Elles seront publiées au prochain lancement du workflow **Release - Create Staging Release (RC)** ' +
        'avec `release_notes: issue`, puis cette issue sera fermée.',
      '',
    ].join('\n'),
  };
}

function summaryMarkdown(result, { version, mode, dryRun }) {
  const title = `## Nouveautés ${version ? `(${version})` : ''}`.trim();
  const status = [
    `**Mode :** \`${mode}\`${dryRun ? ' (aperçu, rien n\'est écrit)' : ''}`,
    `**Résultat :** ${result.message.replace(/\n/g, '<br>')}`,
  ];
  const body = result.entry ? [previewMarkdown(result.entry.features, result.entry.fixes)] : [];
  return [title, '', ...status, '', ...body, ''].join('\n');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function main(argv = process.argv.slice(2), { log = console.log, warn = console.warn } = {}) {
  const { values } = parseArgs({
    args: argv,
    options: {
      mode: { type: 'string', default: 'issue' },
      version: { type: 'string' },
      file: { type: 'string', default: DEFAULT_FILE },
      'issue-body': { type: 'string' },
      summary: { type: 'string' },
      date: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
    },
    strict: true,
  });

  const issuePath = values['issue-body'];
  if (issuePath && !existsSync(issuePath)) {
    throw new UsageError(`Fichier introuvable : ${issuePath}`);
  }
  const issueBody = issuePath ? readFileSync(issuePath, 'utf8') : undefined;

  if (values.check) {
    if (issueBody === undefined) throw new UsageError('--check demande --issue-body <fichier>.');
    const { ok, markdown } = checkComment(issueBody);
    log(markdown);
    return ok ? 0 : 2;
  }

  const data = readNotes(values.file);

  const date = values.date ?? todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UsageError('--date doit être au format AAAA-MM-JJ.');

  const result = computeUpdate(data, { mode: values.mode, version: values.version, date, issueBody });
  warn(result.message);

  if (result.changed && !values['dry-run']) {
    writeFileSync(values.file, serializeNotes(result.data));
  }
  if (result.entry) log(JSON.stringify(result.entry, null, 2));
  if (values.summary) {
    appendFileSync(
      values.summary,
      summaryMarkdown(result, {
        version: values.version ? normalizeVersion(values.version) : '',
        mode: values.mode,
        dryRun: values['dry-run'],
      }),
    );
  }
  return 0;
}

const inActions = process.env.GITHUB_ACTIONS === 'true';
const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  try {
    process.exitCode = main();
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(inActions ? `::error title=Nouveautés::${err.message.replace(/\n/g, '%0A')}` : err.message);
      process.exitCode = 1;
    } else {
      throw err;
    }
  }
}
