// Run: node --test .github/scripts/whats-new/update-whats-new.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkComment, normalizeVersion, parseIssueBody, validateNotes } from './update-whats-new.mjs';

const SCRIPT = fileURLToPath(new URL('./update-whats-new.mjs', import.meta.url));
const DATE = '2026-11-17';

const released = {
  version: '2.5.0',
  date: '2026-11-13',
  features: [
    {
      area: 'Éditeur',
      title: 'Aperçu en direct',
      description: "Vous voyez maintenant l'aperçu de la question pendant la saisie.",
    },
  ],
  fixes: [{ description: 'Les virgules décimales s’affichent correctement dans les formules.' }],
};

/** Body exactly as GitHub renders an issue form submission. */
function issueBody(features, fixes) {
  return [
    '### Nouvelles fonctionnalités',
    '',
    features || '_No response_',
    '',
    '### Corrections',
    '',
    fixes || '_No response_',
  ].join('\n');
}

const goodBody = issueBody(
  "[Éditeur] L'aperçu suit votre curseur : La question modifiée est surlignée.\n" +
    '- [quiz en direct] Rétroaction : Après chaque réponse, une boîte de rétroaction s’affiche.\n' +
    'Nouveau tableau : Un résumé de vos quiz récents.',
  "L'éditeur ne saute plus en haut de la page.\r\n\r\n* Les symboles comme ≠ s'affichent correctement.",
);

let dir;
let file;
let issueFile;

function writeSample(releases) {
  writeFileSync(file, `${JSON.stringify({ releases }, null, 2)}\n`);
}

function readSample() {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, '--file', file, '--date', DATE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '' },
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'whats-new-'));
  file = join(dir, 'whatsNew.json');
  issueFile = join(dir, 'issue.md');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('parseIssueBody', () => {
  test('reads features (with optional zone) and fixes, one per line', () => {
    const { features, fixes, errors } = parseIssueBody(goodBody);
    assert.deepEqual(errors, []);
    assert.deepEqual(features, [
      { area: 'Éditeur', title: "L'aperçu suit votre curseur", description: 'La question modifiée est surlignée.' },
      {
        area: 'Quiz en direct',
        title: 'Rétroaction',
        description: 'Après chaque réponse, une boîte de rétroaction s’affiche.',
      },
      { area: 'Autre', title: 'Nouveau tableau', description: 'Un résumé de vos quiz récents.' },
    ]);
    assert.deepEqual(fixes, [
      { description: "L'éditeur ne saute plus en haut de la page." },
      { description: "Les symboles comme ≠ s'affichent correctement." },
    ]);
  });

  test('only colon followed by a space separates title and description', () => {
    const { features } = parseIssueBody(issueBody('Heures : Le quiz affiche 10:30 au lieu de 10h30.', ''));
    assert.equal(features[0].title, 'Heures');
    assert.equal(features[0].description, 'Le quiz affiche 10:30 au lieu de 10h30.');
  });

  test('fixes only is fine', () => {
    const { features, fixes, errors } = parseIssueBody(issueBody('', 'Une correction.'));
    assert.deepEqual(errors, []);
    assert.equal(features.length, 0);
    assert.equal(fixes.length, 1);
  });

  test('reports a missing separator and an unknown zone with line numbers', () => {
    const { errors } = parseIssueBody(issueBody('Titre sans description\n[Cuisine] Recette : Une recette.', ''));
    assert.equal(errors.length, 2);
    assert.match(errors[0], /ligne 1.*il manque « : »/);
    assert.match(errors[1], /ligne 2.*zone « Cuisine » inconnue/);
  });

  test('both sections empty is an error', () => {
    assert.match(parseIssueBody(issueBody('', '')).errors.join(), /Aucune nouveauté ni correction/);
  });

  test('HTML comments are ignored', () => {
    const { fixes } = parseIssueBody(issueBody('', '<!-- note interne -->\nUne correction.'));
    assert.deepEqual(fixes, [{ description: 'Une correction.' }]);
  });
});

describe('issue mode', () => {
  test('adds the issue notes for the version, newest first', () => {
    writeSample([released]);
    writeFileSync(issueFile, goodBody);
    const { code } = run(['--mode', 'issue', '--version', '2.6.0-rc.0', '--issue-body', issueFile]);
    assert.equal(code, 0);
    const data = readSample();
    assert.deepEqual(
      data.releases.map((r) => r.version),
      ['2.6.0', '2.5.0'],
    );
    assert.equal(data.releases[0].date, DATE);
    assert.equal(data.releases[0].features.length, 3);
    assert.deepEqual(data.releases[1], released);
  });

  test('replaces the notes of the same version (corrected issue, rc.1)', () => {
    writeSample([{ ...released, version: '2.6.0' }, { ...released, version: '2.5.0' }]);
    writeFileSync(issueFile, goodBody);
    const { code } = run(['--mode', 'issue', '--version', '2.6.0-rc.1', '--issue-body', issueFile]);
    assert.equal(code, 0);
    const data = readSample();
    assert.equal(data.releases.length, 2);
    assert.equal(data.releases[0].features[0].title, "L'aperçu suit votre curseur");
  });

  test('without an issue, an RC re-run keeps existing notes', () => {
    writeSample([{ ...released, version: '2.6.0' }, { ...released, version: '2.5.0' }]);
    const before = readFileSync(file, 'utf8');
    const { code } = run(['--mode', 'issue', '--version', '2.6.0-rc.1']);
    assert.equal(code, 0);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('without an issue for a new version, fails and leaves the file unchanged', () => {
    writeSample([released]);
    const before = readFileSync(file, 'utf8');
    const { code, stderr } = run(['--mode', 'issue', '--version', '2.6.0-rc.0']);
    assert.notEqual(code, 0);
    assert.match(stderr, /aucune issue/);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('an issue with format errors fails and leaves the file unchanged', () => {
    writeSample([released]);
    const before = readFileSync(file, 'utf8');
    writeFileSync(issueFile, issueBody('Titre sans séparateur', ''));
    const { code, stderr } = run(['--mode', 'issue', '--version', '2.6.0-rc.0', '--issue-body', issueFile]);
    assert.notEqual(code, 0);
    assert.match(stderr, /il manque « : »/);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('--dry-run prints the entry without writing', () => {
    writeSample([released]);
    const before = readFileSync(file, 'utf8');
    writeFileSync(issueFile, goodBody);
    const { code, stdout } = run(['--mode', 'issue', '--version', '2.6.0-rc.0', '--issue-body', issueFile, '--dry-run']);
    assert.equal(code, 0);
    assert.equal(JSON.parse(stdout).version, '2.6.0');
    assert.equal(readFileSync(file, 'utf8'), before);
  });
});

describe('check mode (issue comment)', () => {
  test('valid issue: exit 0 and a preview comment', () => {
    writeFileSync(issueFile, goodBody);
    const { code, stdout } = run(['--check', '--issue-body', issueFile]);
    assert.equal(code, 0);
    assert.match(stdout, /^<!-- whats-new-check -->/);
    assert.match(stdout, /✅/);
    assert.match(stdout, /\*\*L'aperçu suit votre curseur\*\* _\(Éditeur\)_/);
  });

  test('invalid issue: exit 2 and the list of errors', () => {
    writeFileSync(issueFile, issueBody('[Cuisine] Recette : Une recette.', ''));
    const { code, stdout } = run(['--check', '--issue-body', issueFile]);
    assert.equal(code, 2);
    assert.match(stdout, /❌/);
    assert.match(stdout, /Cuisine/);
  });

  test('checkComment returns ok flag', () => {
    assert.equal(checkComment(goodBody).ok, true);
    assert.equal(checkComment(issueBody('', '')).ok, false);
  });
});

describe('other modes and helpers', () => {
  test('manual / auto modes are no longer accepted', () => {
    writeSample([released]);
    for (const mode of ['manual', 'auto']) {
      const { code, stderr } = run(['--mode', mode, '--version', '2.6.0-rc.0']);
      assert.notEqual(code, 0);
      assert.match(stderr, /issue ou none/);
    }
  });

  test('none mode does nothing, even with an issue', () => {
    writeSample([released]);
    const before = readFileSync(file, 'utf8');
    writeFileSync(issueFile, goodBody);
    const { code } = run(['--mode', 'none', '--version', '2.6.0-rc.0', '--issue-body', issueFile]);
    assert.equal(code, 0);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('--summary appends a readable preview', () => {
    writeSample([released]);
    writeFileSync(issueFile, goodBody);
    const summary = join(dir, 'summary.md');
    run(['--mode', 'issue', '--version', '2.6.0-rc.0', '--issue-body', issueFile, '--summary', summary]);
    const md = readFileSync(summary, 'utf8');
    assert.match(md, /## Nouveautés \(2\.6\.0\)/);
    assert.match(md, /\*\*Corrections\*\*/);
  });

  test('normalizeVersion strips the rc suffix and rejects junk', () => {
    assert.equal(normalizeVersion('2.6.0-rc.12'), '2.6.0');
    assert.equal(normalizeVersion('v2.6.0'), '2.6.0');
    assert.throws(() => normalizeVersion('2.6'));
  });

  test('validateNotes rejects duplicate versions', () => {
    assert.match(validateNotes({ releases: [released, released] }).join('\n'), /double/);
  });
});
