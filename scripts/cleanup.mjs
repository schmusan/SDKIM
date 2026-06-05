import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const uri = envFile.split('\n').find((l) => l.startsWith('MONGODB_URI='))?.split('=').slice(1).join('=').trim();
if (!uri) throw new Error('MONGODB_URI not found in .env');

const collections = [
	'projects',
	'sd_cards',
	'cameras',
	'imports',
	'files',
	'import_logs',
	'app_settings',
	'import_templates'
];

const client = new MongoClient(uri);
await client.connect();
const db = client.db('SDKIM');

for (const name of collections) {
	const res = await db.collection(name).deleteMany({});
	console.log(`${name.padEnd(20)} ${res.deletedCount} Dokumente gelöscht`);
}

await client.close();
console.log('\n✓ Alle Daten gelöscht. Datenbank ist leer.');
