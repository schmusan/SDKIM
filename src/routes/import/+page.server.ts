import { getCollections, mapId } from '$lib/server/db';
import type { FileDoc, CameraDoc } from '$lib/server/db/schema';
import { redirect, fail } from '@sveltejs/kit';
import { getNamingScheme, getBrand } from '$lib/camera-data';

export async function load() {
	const { projects, sd_cards, cameras, imports, files, import_templates } = await getCollections();
	const [allProjects, allSdCards, allCameras, allTemplates] = await Promise.all([
		projects.find().sort({ created_at: -1 }).toArray(),
		sd_cards.find().sort({ created_at: -1 }).toArray(),
		cameras.find().sort({ model: 1 }).toArray(),
		import_templates.find().toArray()
	]);

	// Pro SD-Karte: Importe, dominante Kamera, dominantes Objektiv (aus Metadaten der Dateien).
	const [sdCardCameraStats, sdCardLensStats, importCountsBySdCard] = await Promise.all([
		files
			.aggregate([
				{ $lookup: { from: 'imports', localField: 'import_id', foreignField: '_id', as: 'import' } },
				{ $unwind: '$import' },
				{ $group: { _id: { sd: '$import.sd_card_id', cam: '$exif_camera_model' }, count: { $sum: 1 } } },
				{ $sort: { count: -1 } }
			])
			.toArray(),
		files
			.aggregate([
				{ $lookup: { from: 'imports', localField: 'import_id', foreignField: '_id', as: 'import' } },
				{ $unwind: '$import' },
				{ $group: { _id: { sd: '$import.sd_card_id', lens: '$exif_focal_length' }, count: { $sum: 1 } } },
				{ $sort: { count: -1 } }
			])
			.toArray(),
		imports.aggregate([{ $group: { _id: '$sd_card_id', count: { $sum: 1 } } }]).toArray()
	]);

	const importCountMap = Object.fromEntries(
		importCountsBySdCard.map((s) => [s._id as string, s.count as number])
	);
	const cameraSuggestionMap: Record<string, { model: string; count: number }> = {};
	for (const stat of sdCardCameraStats) {
		const id = (stat._id as { sd: string; cam: string | null }).sd;
		const cam = (stat._id as { sd: string; cam: string | null }).cam;
		if (!id || !cam) continue;
		if (!cameraSuggestionMap[id]) cameraSuggestionMap[id] = { model: cam, count: stat.count as number };
	}
	const lensSuggestionMap: Record<string, string> = {};
	for (const stat of sdCardLensStats) {
		const id = (stat._id as { sd: string; lens: string | null }).sd;
		const lens = (stat._id as { sd: string; lens: string | null }).lens;
		if (!id || !lens) continue;
		if (!lensSuggestionMap[id]) lensSuggestionMap[id] = lens;
	}

	return {
		allProjects: allProjects.map(mapId),
		allSdCards: allSdCards.map((c) => ({
			...mapId(c),
			import_count: importCountMap[c._id] ?? 0,
			suggested_camera: cameraSuggestionMap[c._id] ?? null,
			suggested_lens: lensSuggestionMap[c._id] ?? null
		})),
		allCameras: allCameras.map(mapId),
		allTemplates: allTemplates.map(mapId)
	};
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const { projects, sd_cards, cameras, imports, files, import_logs, import_templates } =
			await getCollections();

		// Projekt anlegen falls neu
		let projectId = data.get('project_id') as string;
		if (projectId === 'new') {
			const name = (data.get('new_project_name') as string)?.trim();
			if (!name) return fail(400, { error: 'Projektname erforderlich' });
			projectId = crypto.randomUUID();
			await projects.insertOne({ _id: projectId, name, created_at: new Date().toISOString() });
		}

		// SD-Karten + zugeordnete Kameras + Objektive (parallel-arrays in selber Reihenfolge wie sd_card_ids)
		const sdCardIds = data.getAll('sd_card_ids') as string[];
		const newLabels = data.getAll('new_sd_labels') as string[];
		const newSerials = data.getAll('new_sd_serials') as string[];
		const cardCameras = data.getAll('card_cameras') as string[];
		const cardLenses = data.getAll('card_lenses') as string[];

		const resolvedCards: Array<{ id: string; camera: string; lens: string }> = [];
		let newIdx = 0;
		for (let i = 0; i < sdCardIds.length; i++) {
			const id = sdCardIds[i];
			const cameraName = (cardCameras[i] ?? '').trim();
			const lensName = (cardLenses[i] ?? '').trim();
			if (id === 'new') {
				const label = (newLabels[newIdx] ?? '').trim();
				const serial = (newSerials[newIdx] ?? '').trim() || null;
				newIdx += 1;
				if (!label) return fail(400, { error: 'Label einer neuen SD-Karte fehlt' });
				const newId = crypto.randomUUID();
				await sd_cards.insertOne({
					_id: newId,
					label,
					serial,
					created_at: new Date().toISOString()
				});
				resolvedCards.push({ id: newId, camera: cameraName || label, lens: lensName });
			} else {
				resolvedCards.push({ id, camera: cameraName, lens: lensName });
			}
		}

		if (resolvedCards.length === 0) return fail(400, { error: 'Mindestens eine SD-Karte erforderlich' });

		const verifyChecksums = data.get('verify_checksums') === 'on';
		const detectDuplicates = data.get('detect_duplicates') === 'on';

		// Template speichern falls gewünscht
		const templateName = (data.get('template_name') as string)?.trim();
		if (templateName) {
			await import_templates.insertOne({
				_id: crypto.randomUUID(),
				name: templateName,
				folder_structure: '{camera}/{date}',
				verify_checksums: verifyChecksums,
				detect_duplicates: detectDuplicates,
				rename_files: false
			});
		}

		// Import pro SD-Karte mit zugeordneter Kamera + Objektiv
		const importIds: string[] = [];
		for (const card of resolvedCards) {
			const importId = crypto.randomUUID();
			await imports.insertOne({
				_id: importId,
				project_id: projectId,
				sd_card_id: card.id,
				status: 'running',
				started_at: new Date().toISOString(),
				file_count: 0,
				total_size: 0,
				duplicate_count: 0,
				error_count: 0
			});

			const sampleFiles = generateSampleFiles(importId, verifyChecksums, detectDuplicates, card.camera, card.lens);
			if (sampleFiles.length > 0) await files.insertMany(sampleFiles as FileDoc[]);

			const totalSize = sampleFiles.reduce((s, f) => s + f.size, 0);
			const duplicateCount = sampleFiles.filter((f) => f.is_duplicate).length;

			await imports.updateOne(
				{ _id: importId },
				{
					$set: {
						status: 'completed',
						completed_at: new Date().toISOString(),
						file_count: sampleFiles.length,
						total_size: totalSize,
						duplicate_count: duplicateCount,
						error_count: 0
					}
				}
			);

			const logEntries = [
				{ import_id: importId, type: 'info', message: `${sampleFiles.length} Dateien gefunden und kopiert` },
				...(duplicateCount > 0
					? [{ import_id: importId, type: 'warning', message: `${duplicateCount} Duplikat(e) erkannt und übersprungen` }]
					: []),
				...(verifyChecksums
					? [{ import_id: importId, type: 'info', message: 'Prüfsummen verifiziert – alle Dateien korrekt' }]
					: [])
			];
			await import_logs.insertMany(
				logEntries.map((e) => ({ _id: crypto.randomUUID(), ...e, created_at: new Date().toISOString() }))
			);

			importIds.push(importId);
		}

		// Kameraprofile auto-anlegen / Objektiv-Historie ergänzen
		await upsertCameraProfiles(cameras, resolvedCards);

		redirect(303, `/import/progress?ids=${importIds.join(',')}`);
	}
};

async function upsertCameraProfiles(
	cameras: { findOne: (q: object) => Promise<CameraDoc | null>; insertOne: (d: CameraDoc) => Promise<unknown>; updateOne: (q: object, u: object) => Promise<unknown> },
	resolvedCards: Array<{ camera: string; lens: string }>
) {
	// Pro einmaliges Kameramodell aus diesem Import: Profil sicherstellen, Objektiv ergänzen
	const byCamera = new Map<string, Set<string>>();
	for (const card of resolvedCards) {
		if (!card.camera) continue;
		const lensSet = byCamera.get(card.camera) ?? new Set<string>();
		if (card.lens) lensSet.add(card.lens);
		byCamera.set(card.camera, lensSet);
	}

	for (const [model, lensSet] of byCamera) {
		const lensesNew = [...lensSet];
		const existing = await cameras.findOne({ model });
		if (existing) {
			const merged = Array.from(new Set([...(existing.lenses ?? []), ...lensesNew]));
			await cameras.updateOne({ _id: existing._id }, { $set: { lenses: merged } });
		} else {
			await cameras.insertOne({
				_id: crypto.randomUUID(),
				model,
				folder_pattern: `${model.replace(/\s+/g, '')}_{lens}`,
				lenses: lensesNew
			});
		}
	}
}

function generateSampleFiles(
	importId: string,
	verify: boolean,
	detectDupes: boolean,
	cameraModel: string,
	lens: string
) {
	const scheme = getNamingScheme(cameraModel);
	const brand = getBrand(cameraModel);
	const folderSlug = (cameraModel || 'UnbekannteKamera').replace(/\s+/g, '');
	const count = Math.floor(Math.random() * 30) + 10;
	const seen = new Set<string>();
	const resolvedLens = lens || '50mm f/1.8';

	return Array.from({ length: count }, (_, i) => {
		const isVideo = Math.random() < 0.4; // ~40% Videos, sonst Fotos
		const ext = isVideo ? scheme.videoExt : scheme.photoExt;
		const base = isVideo ? scheme.videoPrefix(i + 1) : scheme.photoPrefix(i + 1);
		const filename = `${base}.${ext}`;
		const isDuplicate = detectDupes && seen.has(filename);
		seen.add(filename);

		// realistische Dateigrössen
		const size = isVideo
			? Math.random() * 3 * 1073741824 + 512 * 1048576 // 0.5-3.5 GB
			: brand === 'Hasselblad'
				? Math.random() * 120 * 1048576 + 80 * 1048576 // 80-200 MB
				: Math.random() * 50 * 1048576 + 15 * 1048576; // 15-65 MB

		return {
			_id: crypto.randomUUID(),
			import_id: importId,
			filename,
			path: `/${folderSlug}/${resolvedLens.replace(/\s+/g, '_')}/${filename}`,
			size,
			checksum: verify ? crypto.randomUUID().replace(/-/g, '') : null,
			camera_id: null,
			exif_camera_model: cameraModel,
			exif_iso: Math.floor(Math.random() * 3200) + 100,
			exif_shutter: `1/${Math.floor(Math.random() * 500) + 50}`,
			exif_focal_length: resolvedLens,
			is_duplicate: isDuplicate,
			created_at: new Date().toISOString()
		};
	});
}
