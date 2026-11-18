// Run: node --test .github/scripts/whats-new/update-whats-new.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { normalizeVersion, validateNotes } from './update-whats-new.mjs';

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

const unreleased = {
  version: 'unreleased',
  features: [
    {
      area: 'Quiz en direct',
      title: 'Nom de la salle affiché',
      description: 'Les élèves voient le nom de la salle et le numéro de la question.',
    },
  ],
  fixes: [],
};

let dir;
let file;

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
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('manual mode', () => {
  test('stamps the unreleased entry with the version and date', () => {
    writeSample([unreleased, released]);
    const { code } = run(['--mode', 'manual', '--version', '2.6.0-rc.0']);
    assert.equal(code, 0);
    const data = readSample();
    assert.equal(data.releases.length, 2);
    assert.equal(data.releases[0].version, '2.6.0');
    assert.equal(data.releases[0].date, DATE);
    assert.deepEqual(data.releases[0].features, unreleased.features);
    assert.deepEqual(data.releases[1], released);
  });

  test('fails without an unreleased entry and leaves the file unchanged', () => {
    writeSample([released]);
    const before = readFileSync(file, 'utf8');
    const { code, stderr } = run(['--mode', 'manual', '--version', '2.6.0-rc.0']);
    assert.notEqual(code, 0);
    assert.match(stderr, /unreleased/);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('fails on an invalid unreleased entry', () => {
    writeSample([{ version: 'unreleased', features: [], fixes: [] }, released]);
    const { code } = run(['--mode', 'manual', '--version', '2.6.0-rc.0']);
    assert.notEqual(code, 0);
  });

  test('RC re-run keeps the already stamped entry', () => {
    writeSample([{ ...unreleased, version: '2.6.0', date: '2026-11-16' }, released]);
    const before = readFileSync(file, 'utf8');
    const { code } = run(['--mode', 'manual', '--version', '2.6.0-rc.1']);
    assert.equal(code, 0);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('--dry-run prints the entry without writing', () => {
    writeSample([unreleased, released]);
    const before = readFileSync(file, 'utf8');
    const { code, stdout } = run(['--mode', 'manual', '--version', '2.6.0-rc.0', '--dry-run']);
    assert.equal(code, 0);
    assert.equal(JSON.parse(stdout).version, '2.6.0');
    assert.equal(readFileSync(file, 'utf8'), before);
  });
});

describe('other modes and helpers', () => {
  test('auto mode is no longer accepted', () => {
    writeSample([unreleased, released]);
    const before = readFileSync(file, 'utf8');
    const { code, stderr } = run(['--mode', 'auto', '--version', '2.6.0-rc.0']);
    assert.notEqual(code, 0);
    assert.match(stderr, /manual ou none/);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('none mode does nothing', () => {
    writeSample([unreleased, released]);
    const before = readFileSync(file, 'utf8');
    const { code } = run(['--mode', 'none', '--version', '2.6.0-rc.0']);
    assert.equal(code, 0);
    assert.equal(readFileSync(file, 'utf8'), before);
  });

  test('--summary appends markdown', () => {
    writeSample([unreleased, released]);
    const summary = join(dir, 'summary.md');
    run(['--mode', 'manual', '--version', '2.6.0-rc.0', '--summary', summary]);
    assert.match(readFileSync(summary, 'utf8'), /```json[\s\S]*"2\.6\.0"/);
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
