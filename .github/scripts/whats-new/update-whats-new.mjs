#!/usr/bin/env node
// Met à jour client/src/data/whatsNew.json au moment d'une release (RC).
// Plain Node, aucune dépendance.
//
// Usage:
//   node update-whats-new.mjs --mode manual|none --version X.Y.Z-rc.N
//        [--file client/src/data/whatsNew.json] [--summary <path>]
//        [--dry-run] [--date YYYY-MM-DD]
//
// Modes:
//   manual  An "unreleased" entry is required; it gets stamped with the version
//           and today's date (UTC). If no "unreleased" entry exists but the
//           version already has an entry (RC re-run), it is kept as is.
//   none    Nothing is changed.

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const DEFAULT_FILE = 'client/src/data/whatsNew.json';
export const UNRELEASED = 'unreleased';
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

function checkText(value, path, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} doit être un texte non vide.`);
    return;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    errors.push(`${path} est trop long (${value.length} > ${MAX_TEXT_LENGTH} caractères).`);
  }
}

/**
 * Validate one release entry. Returns a list of error messages (empty = valid).
 */
export function validateEntry(entry, { label = 'entrée' } = {}) {
  const errors = [];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`${label} doit être un objet.`];
  }
  if (typeof entry.version !== 'string' || entry.version.trim() === '') {
    errors.push(`${label}.version doit être un texte non vide.`);
  } else if (entry.version !== UNRELEASED && !/^\d+\.\d+\.\d+$/.test(entry.version)) {
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

/** Keep only the known fields, trimmed, in a stable key order. */
function cleanEntry(version, date, source) {
  const entry = { version };
  if (date) entry.date = date;
  entry.features = (source.features ?? []).map((f) => ({
    area: f.area.trim(),
    title: f.title.trim(),
    description: f.description.trim(),
  }));
  entry.fixes = (source.fixes ?? []).map((f) => ({ description: f.description.trim() }));
  return entry;
}

/**
 * Insert or replace the entry for `entry.version`, removing any "unreleased"
 * entry that was consumed. New entries go first (newest first).
 */
function upsert(data, entry) {
  const releases = data.releases.filter((r) => r.version !== UNRELEASED);
  const existing = releases.findIndex((r) => r.version === entry.version);
  if (existing >= 0) {
    releases[existing] = entry;
  } else {
    releases.unshift(entry);
  }
  return { ...data, releases };
}

// ---------------------------------------------------------------------------
// Core update logic (pure: no I/O)
// ---------------------------------------------------------------------------

/**
 * @returns {{ changed: boolean, data: object, entry?: object, message: string }}
 * @throws {UsageError} for anything that must stop the release.
 */
export function computeUpdate(data, { mode, version, date }) {
  if (!['manual', 'none'].includes(mode)) {
    throw new UsageError(`--mode doit être manual ou none (reçu : "${mode}").`);
  }
  if (mode === 'none') {
    return { changed: false, data, message: 'Mode "none" : aucune note de version générée.' };
  }
  const v = normalizeVersion(version);

  const unreleasedIdx = data.releases.findIndex((r) => r.version === UNRELEASED);
  if (data.releases.filter((r) => r.version === UNRELEASED).length > 1) {
    throw new UsageError('Plusieurs entrées "unreleased" trouvées ; il ne doit y en avoir qu\'une.');
  }

  if (unreleasedIdx >= 0) {
    const draft = data.releases[unreleasedIdx];
    const errors = validateEntry(draft, { label: 'entrée "unreleased"' });
    if (errors.length) {
      throw new UsageError(`L'entrée "unreleased" est invalide :\n- ${errors.join('\n- ')}`);
    }
    const entry = cleanEntry(v, date, draft);
    const next = upsert(data, entry);
    assertValid(next);
    return {
      changed: true,
      data: next,
      entry,
      message: `Entrée "unreleased" estampillée ${v} (${date}).`,
    };
  }

  // No draft: an RC re-run (rc.1, rc.2…) keeps the notes already stamped for this version.
  const existing = data.releases.find((r) => r.version === v);
  if (existing) {
    return {
      changed: false,
      data,
      entry: existing,
      message: `Aucune entrée "unreleased", mais ${v} a déjà des notes (relance d'un RC) : conservées telles quelles.`,
    };
  }
  throw new UsageError(
    `Mode "manual" : aucune entrée "unreleased" dans le fichier de notes.\n` +
      `Ajoutez-en une en haut de "releases" (voir client/src/data/README.md) via une PR vers staging, ` +
      `ou relancez avec release_notes: none.`,
  );
}

function assertValid(data) {
  const errors = validateNotes(data);
  if (errors.length) {
    throw new UsageError(`Le fichier de notes résultant est invalide :\n- ${errors.join('\n- ')}`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function entryMarkdown(result, { version, mode, dryRun }) {
  const title = `## Nouveautés ${version ? `(${version})` : ''}`.trim();
  const status = [
    `**Mode :** \`${mode}\`${dryRun ? ' (aperçu, rien n\'est écrit)' : ''}`,
    `**Résultat :** ${result.message.replace(/\n/g, '<br>')}`,
  ];
  const body = result.entry ? ['```json', JSON.stringify(result.entry, null, 2), '```'] : [];
  return [title, '', ...status, '', ...body, ''].join('\n');
}

export function main(argv = process.argv.slice(2), { log = console.log, warn = console.warn } = {}) {
  const { values } = parseArgs({
    args: argv,
    options: {
      mode: { type: 'string', default: 'manual' },
      version: { type: 'string' },
      file: { type: 'string', default: DEFAULT_FILE },
      summary: { type: 'string' },
      date: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
    strict: true,
  });

  const data = readNotes(values.file);

  const date = values.date ?? todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UsageError('--date doit être au format AAAA-MM-JJ.');

  const result = computeUpdate(data, { mode: values.mode, version: values.version, date });
  warn(result.message);

  if (result.changed && !values['dry-run']) {
    writeFileSync(values.file, serializeNotes(result.data));
  }
  if (result.entry) log(JSON.stringify(result.entry, null, 2));
  if (values.summary) {
    appendFileSync(
      values.summary,
      entryMarkdown(result, {
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
