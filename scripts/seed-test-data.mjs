import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const uri = envFile.split('\n').find((l) => l.startsWith('MONGODB_URI='))?.split('=').slice(1).join('=').trim();
if (!uri) throw new Error('MONGODB_URI not found in .env');

// Per-Brand-Konventionen (Kopie aus camera-data.ts)
const SCHEMES = {
	Sony:       { photoExt: 'ARW', videoExt: 'MP4', photo: (n) => `DSC0${String(n).padStart(4,'0')}`, video: (n) => `C${String(n).padStart(4,'0')}` },
	Canon:      { photoExt: 'CR3', videoExt: 'MP4', photo: (n) => `IMG_${String(n).padStart(4,'0')}`, video: (n) => `MVI_${String(n).padStart(4,'0')}` },
	Nikon:      { photoExt: 'NEF', videoExt: 'MOV', photo: (n) => `DSC_${String(n).padStart(4,'0')}`, video: (n) => `DSC_${String(n).padStart(4,'0')}` },
	Panasonic:  { photoExt: 'RW2', videoExt: 'MP4', photo: (n) => `P101${String(n).padStart(4,'0')}`, video: (n) => `P101${String(n).padStart(4,'0')}` },
	Leica:      { photoExt: 'DNG', videoExt: 'MP4', photo: (n) => `L101${String(n).padStart(4,'0')}`, video: (n) => `L101${String(n).padStart(4,'0')}` }
};

const LENSES = {
	Sony:      ['FE 24-70mm f/2.8 GM II','FE 70-200mm f/2.8 GM OSS II','FE 16-35mm f/2.8 GM','FE 85mm f/1.4 GM','FE 50mm f/1.2 GM'],
	Canon:     ['RF 24-70mm f/2.8L IS USM','RF 70-200mm f/2.8L IS USM','RF 50mm f/1.2L USM','RF 85mm f/1.2L USM'],
	Nikon:     ['Z 24-70mm f/2.8 S','Z 70-200mm f/2.8 VR S','Z 50mm f/1.2 S','Z 14-24mm f/2.8 S'],
	Panasonic: ['Lumix S 24-70mm f/2.8','Lumix S 70-200mm f/2.8 OIS','Lumix S 50mm f/1.4'],
	Leica:     ['Summicron-SL 50mm f/2 ASPH','Vario-Elmarit-SL 24-90mm f/2.8-4 ASPH','Summilux-SL 50mm f/1.4 ASPH']
};

function getBrand(model) {
	const m = model.toLowerCase();
	if (m.startsWith('sony')) return 'Sony';
	if (m.startsWith('canon')) return 'Canon';
	if (m.startsWith('nikon')) return 'Nikon';
	if (m.startsWith('panasonic') || m.startsWith('lumix')) return 'Panasonic';
	if (m.startsWith('leica')) return 'Leica';
	return 'Sony';
}

function randomSerial() {
	return 'SD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 5 Projekte, je nur eine Marke, mit 2-3 Modellen
const SEED_PROJECTS = [
	{
		name: '2026-06-06_Sony_Werbespot',
		notes: 'Werbespot für Kunde X — drei Sony-Bodies (A7 IV, A7R V, FX3)',
		models: ['Sony A7 IV', 'Sony A7R V', 'Sony FX3']
	},
	{
		name: '2026-06-06_Canon_Hochzeit',
		notes: 'Hochzeitsproduktion — zwei Canon-Bodies (EOS R5 + R6 Mark II)',
		models: ['Canon EOS R5', 'Canon EOS R6 Mark II']
	},
	{
		name: '2026-06-06_Nikon_Wildlife',
		notes: 'Wildlife-Shoot — drei Nikon-Bodies (Z9, Z8, Z7 II)',
		models: ['Nikon Z9', 'Nikon Z8', 'Nikon Z7 II']
	},
	{
		name: '2026-06-06_Panasonic_Doku',
		notes: 'Dokumentarfilm — zwei Panasonic Lumix-Bodies (S5 II + S1H)',
		models: ['Panasonic Lumix S5 II', 'Panasonic Lumix S1H']
	},
	{
		name: '2026-06-06_Leica_Editorial',
		notes: 'Editorial-Shoot — drei Leica-Bodies (SL3, M11, Q3)',
		models: ['Leica SL3', 'Leica M11', 'Leica Q3']
	}
];

function generateFiles(importId, cameraModel, lens, count) {
	const brand = getBrand(cameraModel);
	const scheme = SCHEMES[brand];
	const slug = cameraModel.replace(/\s+/g, '');
	const files = [];
	for (let i = 1; i <= count; i++) {
		const isVideo = Math.random() < 0.35;
		const ext = isVideo ? scheme.videoExt : scheme.photoExt;
		const base = isVideo ? scheme.video(i) : scheme.photo(i);
		const filename = `${base}.${ext}`;
		const size = isVideo
			? Math.random() * 3 * 1073741824 + 512 * 1048576
			: Math.random() * 50 * 1048576 + 15 * 1048576;
		files.push({
			_id: crypto.randomUUID(),
			import_id: importId,
			filename,
			path: `/${slug}/${lens.replace(/\s+/g,'_')}/${filename}`,
			size,
			checksum: crypto.randomBytes(16).toString('hex'),
			camera_id: null,
			exif_camera_model: cameraModel,
			exif_iso: Math.floor(Math.random() * 3200) + 100,
			exif_shutter: `1/${Math.floor(Math.random() * 500) + 50}`,
			exif_focal_length: lens,
			is_duplicate: false,
			created_at: new Date().toISOString()
		});
	}
	return files;
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db('SDKIM');

const projects = db.collection('projects');
const sdCards = db.collection('sd_cards');
const cameras = db.collection('cameras');
const imports = db.collection('imports');
const files = db.collection('files');
const importLogs = db.collection('import_logs');

const camerasUsed = new Map(); // model -> Set<lens>

for (const proj of SEED_PROJECTS) {
	const projectId = crypto.randomUUID();
	const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)).toISOString();
	await projects.insertOne({ _id: projectId, name: proj.name, notes: proj.notes, created_at: createdAt });
	console.log(`\n✓ Projekt: ${proj.name}`);

	for (const model of proj.models) {
		const brand = getBrand(model);
		const lens = rand(LENSES[brand]);
		const sdCardId = crypto.randomUUID();
		const importId = crypto.randomUUID();
		const fileCount = Math.floor(Math.random() * 30) + 15;
		const startedAt = new Date(new Date(createdAt).getTime() + Math.random() * 3600 * 1000).toISOString();
		const completedAt = new Date(new Date(startedAt).getTime() + (Math.random() * 30 + 5) * 1000).toISOString();

		await sdCards.insertOne({
			_id: sdCardId,
			label: model,
			serial: randomSerial(),
			created_at: startedAt
		});

		const docs = generateFiles(importId, model, lens, fileCount);
		const totalSize = docs.reduce((s, f) => s + f.size, 0);
		await files.insertMany(docs);

		await imports.insertOne({
			_id: importId,
			project_id: projectId,
			sd_card_id: sdCardId,
			status: 'completed',
			started_at: startedAt,
			completed_at: completedAt,
			file_count: fileCount,
			total_size: totalSize,
			duplicate_count: 0,
			error_count: 0
		});

		await importLogs.insertMany([
			{ _id: crypto.randomUUID(), import_id: importId, type: 'info', message: `${fileCount} Dateien gefunden und kopiert`, created_at: startedAt },
			{ _id: crypto.randomUUID(), import_id: importId, type: 'info', message: 'Prüfsummen verifiziert – alle Dateien korrekt', created_at: completedAt }
		]);

		const lensSet = camerasUsed.get(model) ?? new Set();
		lensSet.add(lens);
		camerasUsed.set(model, lensSet);

		console.log(`   • ${model} → ${fileCount} Dateien (${(totalSize/1073741824).toFixed(1)} GB) · ${lens}`);
	}
}

// Kameraprofile upserten
console.log('\n--- Kameraprofile ---');
for (const [model, lensSet] of camerasUsed) {
	const existing = await cameras.findOne({ model });
	const lensesNew = [...lensSet];
	if (existing) {
		const merged = Array.from(new Set([...(existing.lenses ?? []), ...lensesNew]));
		await cameras.updateOne({ _id: existing._id }, { $set: { lenses: merged } });
		console.log(`   ↻ ${model} ergänzt`);
	} else {
		await cameras.insertOne({
			_id: crypto.randomUUID(),
			model,
			folder_pattern: `${model.replace(/\s+/g,'')}_{lens}`,
			lenses: lensesNew
		});
		console.log(`   + ${model} neu angelegt`);
	}
}

await client.close();
console.log('\n✓ Seed-Daten eingefügt.');
