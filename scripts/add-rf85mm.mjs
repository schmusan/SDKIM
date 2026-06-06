// Fügt einem bestehenden Projekt einen RF 85mm-Import hinzu (für Video-Demo)
import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const uri = envFile.split('\n').find((l) => l.startsWith('MONGODB_URI='))?.split('=').slice(1).join('=').trim();
if (!uri) throw new Error('MONGODB_URI not found in .env');

const TARGET_PROJECT_NAME_PARTIAL = 'Canon_Hochzeit';
const CAMERA_MODEL = 'Canon EOS R5';
const LENS = 'RF 85mm f/1.2L USM';
const FILE_COUNT = 26;

const client = new MongoClient(uri);
await client.connect();
const db = client.db('SDKIM');

const projects = db.collection('projects');
const sdCards = db.collection('sd_cards');
const cameras = db.collection('cameras');
const imports = db.collection('imports');
const files = db.collection('files');
const importLogs = db.collection('import_logs');

const project = await projects.findOne({ name: { $regex: TARGET_PROJECT_NAME_PARTIAL } });
if (!project) {
	console.error(`Projekt "${TARGET_PROJECT_NAME_PARTIAL}" nicht gefunden`);
	process.exit(1);
}
console.log(`→ Projekt: ${project.name}`);

const sdCardId = crypto.randomUUID();
const sdLabel = 'Canon EOS R5 (85mm)';
const sdSerial = 'SD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const importId = crypto.randomUUID();
const startedAt = new Date(Date.now() - 6 * 3600 * 1000).toISOString(); // vor 6h
const completedAt = new Date(new Date(startedAt).getTime() + 15 * 1000).toISOString();

await sdCards.insertOne({
	_id: sdCardId,
	label: sdLabel,
	serial: sdSerial,
	created_at: startedAt
});
console.log(`✓ SD-Karte angelegt: ${sdLabel}`);

const fileDocs = [];
let totalSize = 0;
for (let i = 1; i <= FILE_COUNT; i++) {
	const isVideo = Math.random() < 0.3;
	const ext = isVideo ? 'MP4' : 'CR3';
	const base = isVideo ? `MVI_${String(i).padStart(4, '0')}` : `IMG_${String(i).padStart(4, '0')}`;
	const filename = `${base}.${ext}`;
	const size = isVideo
		? Math.random() * 2 * 1073741824 + 256 * 1048576
		: Math.random() * 45 * 1048576 + 20 * 1048576;
	totalSize += size;
	fileDocs.push({
		_id: crypto.randomUUID(),
		import_id: importId,
		filename,
		path: `/CanonEOSR5/RF_85mm_f_1.2L_USM/${filename}`,
		size,
		checksum: crypto.randomBytes(16).toString('hex'),
		camera_id: null,
		exif_camera_model: CAMERA_MODEL,
		exif_iso: Math.floor(Math.random() * 1600) + 100,
		exif_shutter: `1/${Math.floor(Math.random() * 250) + 100}`,
		exif_focal_length: LENS,
		is_duplicate: false,
		created_at: startedAt
	});
}
await files.insertMany(fileDocs);
console.log(`✓ ${FILE_COUNT} Dateien generiert (${(totalSize / 1073741824).toFixed(2)} GB)`);

await imports.insertOne({
	_id: importId,
	project_id: project._id,
	sd_card_id: sdCardId,
	status: 'completed',
	started_at: startedAt,
	completed_at: completedAt,
	file_count: FILE_COUNT,
	total_size: totalSize,
	duplicate_count: 0,
	error_count: 0
});
console.log(`✓ Import-Eintrag angelegt`);

await importLogs.insertMany([
	{ _id: crypto.randomUUID(), import_id: importId, type: 'info', message: `${FILE_COUNT} Dateien gefunden und kopiert`, created_at: startedAt },
	{ _id: crypto.randomUUID(), import_id: importId, type: 'info', message: 'Prüfsummen verifiziert – alle Dateien korrekt', created_at: completedAt }
]);

// Kameraprofil upserten
const existing = await cameras.findOne({ model: CAMERA_MODEL });
if (existing) {
	const merged = Array.from(new Set([...(existing.lenses ?? []), LENS]));
	await cameras.updateOne({ _id: existing._id }, { $set: { lenses: merged } });
	console.log(`✓ Kamera "${CAMERA_MODEL}" um ${LENS} ergänzt`);
} else {
	await cameras.insertOne({
		_id: crypto.randomUUID(),
		model: CAMERA_MODEL,
		folder_pattern: 'CanonEOSR5_{lens}',
		lenses: [LENS]
	});
	console.log(`✓ Kamera "${CAMERA_MODEL}" neu angelegt`);
}

await client.close();
console.log(`\n✓ Fertig. Projekt "${project.name}" enthält jetzt ${CAMERA_MODEL} mit ${LENS}.`);
