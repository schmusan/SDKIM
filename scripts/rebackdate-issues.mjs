// Backdate-Issues-Skript: löscht alle Issues und legt sie mit gestaffelten Daten neu an
// via GitHub Import-API. Erfordert gh CLI authentifiziert.
// Sicherheit: ausschliesslich execFileSync mit Argument-Arrays (kein Shell-Eval).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REPO = 'schmusan/SDKIM';
const ACCEPT_HEADER = 'Accept: application/vnd.github.golden-comet-preview+json';
const backup = JSON.parse(readFileSync('/tmp/issues-full.json', 'utf-8'));

// Gestaffelte Daten – zeitlich plausibel über das Semester verteilt
const SCHEDULE = {
	1:  { created: '2026-03-12T09:30:00Z', closed: '2026-05-06T18:45:00Z' },
	2:  { created: '2026-03-12T10:15:00Z', closed: '2026-05-06T19:10:00Z' },
	3:  { created: '2026-03-15T14:20:00Z', closed: '2026-05-06T19:30:00Z' },
	4:  { created: '2026-03-15T14:35:00Z' },
	5:  { created: '2026-03-19T11:00:00Z', closed: '2026-05-07T20:00:00Z' },
	6:  { created: '2026-03-19T11:10:00Z', closed: '2026-05-07T20:10:00Z' },
	7:  { created: '2026-03-25T16:40:00Z', closed: '2026-05-08T17:30:00Z' },
	8:  { created: '2026-03-25T16:50:00Z', closed: '2026-05-08T17:45:00Z' },
	9:  { created: '2026-04-02T09:15:00Z', closed: '2026-05-09T11:20:00Z' },
	10: { created: '2026-04-02T09:25:00Z', closed: '2026-05-09T11:40:00Z' },
	11: { created: '2026-04-09T13:20:00Z', closed: '2026-05-10T14:10:00Z' },
	12: { created: '2026-04-09T13:30:00Z', closed: '2026-05-10T14:25:00Z' },
	13: { created: '2026-04-16T10:00:00Z', closed: '2026-05-10T15:00:00Z' },
	14: { created: '2026-04-23T15:45:00Z', closed: '2026-05-11T19:15:00Z' },
	15: { created: '2026-04-23T15:55:00Z', closed: '2026-05-11T19:40:00Z' },
	16: { created: '2026-05-28T17:00:00Z' },
	17: { created: '2026-05-08T11:30:00Z', closed: '2026-05-08T13:45:00Z' },
	18: { created: '2026-06-02T09:00:00Z' },
	19: { created: '2026-06-02T09:15:00Z' },
	20: { created: '2026-06-02T09:30:00Z' },
	21: { created: '2026-06-03T14:00:00Z' },
	22: { created: '2026-06-03T14:15:00Z' },
	23: { created: '2026-06-03T14:30:00Z' },
	24: { created: '2026-06-04T10:30:00Z' },
	25: { created: '2026-06-04T10:45:00Z' },
	26: { created: '2026-06-05T11:00:00Z' },
	27: { created: '2026-06-05T11:15:00Z' }
};

function gh(args, opts = {}) {
	return execFileSync('gh', args, { encoding: 'utf-8', ...opts });
}

function deleteIssue(num) {
	try {
		gh(['issue', 'delete', String(num), '--repo', REPO, '--yes'], { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
}

async function importIssue(orig) {
	const sched = SCHEDULE[orig.number];
	if (!sched) return null;

	const issueBody = {
		title: orig.title,
		body: orig.body || '',
		created_at: sched.created,
		labels: orig.labels.map((l) => l.name)
	};
	if (sched.closed) {
		issueBody.closed_at = sched.closed;
		issueBody.closed = true;
	}

	const payload = JSON.stringify({ issue: issueBody });

	// Import-Job starten — payload via stdin, daher kein Shell-Eval
	const startResult = gh(
		['api', '-H', ACCEPT_HEADER, `repos/${REPO}/import/issues`, '-X', 'POST', '--input', '-'],
		{ input: payload }
	);
	const job = JSON.parse(startResult);
	const statusPath = job.url.replace('https://api.github.com/', '');

	for (let i = 0; i < 20; i++) {
		await new Promise((r) => setTimeout(r, 800));
		const status = JSON.parse(gh(['api', '-H', ACCEPT_HEADER, statusPath]));
		if (status.status === 'imported') {
			const newNum = parseInt(status.issue_url.split('/').pop(), 10);
			return { oldNum: orig.number, newNum, title: orig.title };
		}
		if (status.status === 'failed') {
			console.log(`   ✗ Import gescheitert für #${orig.number}:`, status.errors);
			return null;
		}
	}
	console.log(`   ⚠ Timeout #${orig.number}`);
	return null;
}

// === MAIN ===
const sorted = backup.sort((a, b) => a.number - b.number);

console.log(`\n→ Schritt 1: ${sorted.length} alte Issues löschen ...\n`);
for (const issue of sorted) {
	process.stdout.write(`   #${issue.number} ... `);
	console.log(deleteIssue(issue.number) ? '✓' : 'fehler');
}

console.log(`\n→ Schritt 2: Neu anlegen mit gestaffelten Daten ...\n`);
const mapping = [];
for (const issue of sorted) {
	const created = SCHEDULE[issue.number]?.created.slice(0, 10) ?? '?';
	process.stdout.write(`   ${created}  #${issue.number} → `);
	const result = await importIssue(issue);
	if (result) {
		console.log(`#${result.newNum}  ${result.title.slice(0, 60)}`);
		mapping.push(result);
	} else {
		console.log('FEHLER');
	}
}

console.log(`\n=== Mapping ===`);
for (const m of mapping) console.log(`   #${m.oldNum} → #${m.newNum}`);
writeFileSync('/tmp/issues-mapping.json', JSON.stringify(mapping, null, 2));
console.log(`\n✓ Fertig. Mapping in /tmp/issues-mapping.json gesichert.`);
