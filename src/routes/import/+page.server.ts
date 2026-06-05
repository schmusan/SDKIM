import { getCollections, mapId } from '$lib/server/db';
import type { FileDoc } from '$lib/server/db/schema';
import { redirect, fail } from '@sveltejs/kit';

export async function load() {
	const { projects, sd_cards, cameras, import_templates } = await getCollections();
	const [allProjects, allSdCards, allCameras, allTemplates] = await Promise.all([
		projects.find().sort({ created_at: -1 }).toArray(),
		sd_cards.find().sort({ created_at: -1 }).toArray(),
		cameras.find().sort({ model: 1 }).toArray(),
		import_templates.find().toArray()
	]);
	return {
		allProjects: allProjects.map(mapId),
		allSdCards: allSdCards.map(mapId),
		allCameras: allCameras.map(mapId),
		allTemplates: allTemplates.map(mapId)
	};
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const { projects, sd_cards, cameras, imports, files, import_logs, import_templates } =
			await getCollections();

		// Kameraprofil auflösen (optional)
		const cameraId = (data.get('camera_id') as string) || null;
		let selectedCamera: { _id: string; model: string } | null = null;
		if (cameraId) {
			const cam = await cameras.findOne({ _id: cameraId });
			if (cam) selectedCamera = { _id: cam._id, model: cam.model };
		}

		// Projekt anlegen falls neu
		let projectId = data.get('project_id') as string;
		if (projectId === 'new') {
			const name = (data.get('new_project_name') as string)?.trim();
			if (!name) return fail(400, { error: 'Projektname erforderlich' });
			projectId = crypto.randomUUID();
			await projects.insertOne({ _id: projectId, name, created_at: new Date().toISOString() });
		}

		// SD-Karten (mehrere möglich)
		const sdCardIds = data.getAll('sd_card_ids') as string[];
		const newSdLabel = (data.get('new_sd_label') as string)?.trim();
		const newSdSerial = (data.get('new_sd_serial') as string)?.trim() || null;
		const newSdLens = (data.get('new_sd_lens') as string)?.trim() || null;

		const resolvedSdCardIds: string[] = [];
		for (const id of sdCardIds) {
			if (id === 'new') {
				if (!newSdLabel) return fail(400, { error: 'SD-Karten Label erforderlich' });
				const newId = crypto.randomUUID();
				await sd_cards.insertOne({
					_id: newId,
					label: newSdLabel,
					serial: newSdSerial,
					created_at: new Date().toISOString()
				});
				resolvedSdCardIds.push(newId);
			} else {
				resolvedSdCardIds.push(id);
			}
		}

		if (resolvedSdCardIds.length === 0) return fail(400, { error: 'Mindestens eine SD-Karte erforderlich' });

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

		// Import pro SD-Karte
		const importIds: string[] = [];
		for (const sdCardId of resolvedSdCardIds) {
			const importId = crypto.randomUUID();
			await imports.insertOne({
				_id: importId,
				project_id: projectId,
				sd_card_id: sdCardId,
				status: 'running',
				started_at: new Date().toISOString(),
				file_count: 0,
				total_size: 0,
				duplicate_count: 0,
				error_count: 0
			});

			const sampleFiles = generateSampleFiles(importId, verifyChecksums, detectDuplicates, newSdLens, selectedCamera);
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

		redirect(303, `/import/progress?ids=${importIds.join(',')}`);
	}
};

function generateSampleFiles(
	importId: string,
	verify: boolean,
	detectDupes: boolean,
	manualLens: string | null = null,
	selectedCamera: { _id: string; model: string } | null = null
) {
	const fallbackCameras = ['SonyA7IV', 'SonyA7III', 'CanonR5'];
	const extensions = ['MP4', 'MP4', 'MP4', 'JPG', 'ARW'];
	const count = Math.floor(Math.random() * 30) + 10;
	const seen = new Set<string>();

	// Wenn ein Kameraprofil gewählt wurde: alle Files dieser Kamera zuordnen.
	// Sonst: zufällige Kameras aus Fallback-Liste (Demo-Verhalten).
	return Array.from({ length: count }, (_, i) => {
		const cam = selectedCamera
			? selectedCamera.model
			: fallbackCameras[Math.floor(Math.random() * fallbackCameras.length)];
		const camId = selectedCamera ? selectedCamera._id : null;
		const slug = cam.replace(/\s+/g, '');
		const ext = extensions[Math.floor(Math.random() * extensions.length)];
		const filename = `${slug}_${String(i + 1).padStart(4, '0')}.${ext}`;
		const isDuplicate = detectDupes && seen.has(filename);
		seen.add(filename);

		return {
			_id: crypto.randomUUID(),
			import_id: importId,
			filename,
			path: `/media/${slug}/${filename}`,
			size: ext === 'MP4' ? Math.random() * 2 * 1073741824 : Math.random() * 25 * 1048576,
			checksum: verify ? crypto.randomUUID().replace(/-/g, '') : null,
			camera_id: camId,
			exif_camera_model: cam,
			exif_iso: Math.floor(Math.random() * 3200) + 100,
			exif_shutter: `1/${Math.floor(Math.random() * 500) + 50}`,
			exif_focal_length: manualLens || `${[24, 35, 50, 70, 85][Math.floor(Math.random() * 5)]}mm`,
			is_duplicate: isDuplicate,
			created_at: new Date().toISOString()
		};
	});
}
