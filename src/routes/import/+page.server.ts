import { db } from '$lib/server/db';
import { projects, sd_cards, imports, import_templates, files, import_logs } from '$lib/server/db/schema';
import { redirect, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';

export async function load() {
	const allProjects = await db.select().from(projects).orderBy(desc(projects.created_at));
	const allSdCards = await db.select().from(sd_cards).orderBy(desc(sd_cards.created_at));
	const allTemplates = await db.select().from(import_templates);
	return { allProjects, allSdCards, allTemplates };
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		// Projekt anlegen falls neu
		let projectId = data.get('project_id') as string;
		if (projectId === 'new') {
			const name = (data.get('new_project_name') as string)?.trim();
			if (!name) return fail(400, { error: 'Projektname erforderlich' });
			const [created] = await db.insert(projects).values({ name }).returning();
			projectId = created.id;
		}

		// SD-Karten (mehrere möglich)
		const sdCardIds = data.getAll('sd_card_ids') as string[];
		const newSdLabel = (data.get('new_sd_label') as string)?.trim();
		const newSdSerial = (data.get('new_sd_serial') as string)?.trim() || null;

		const resolvedSdCardIds: string[] = [];
		for (const id of sdCardIds) {
			if (id === 'new') {
				if (!newSdLabel) return fail(400, { error: 'SD-Karten Label erforderlich' });
				const [created] = await db.insert(sd_cards).values({ label: newSdLabel, serial: newSdSerial }).returning();
				resolvedSdCardIds.push(created.id);
			} else {
				resolvedSdCardIds.push(id);
			}
		}

		if (resolvedSdCardIds.length === 0) return fail(400, { error: 'Mindestens eine SD-Karte erforderlich' });

		const verifyChecksums = data.get('verify_checksums') === 'on' ? 1 : 0;
		const detectDuplicates = data.get('detect_duplicates') === 'on' ? 1 : 0;

		// Template speichern falls gewünscht
		const templateName = (data.get('template_name') as string)?.trim();
		if (templateName) {
			await db.insert(import_templates).values({
				name: templateName,
				folder_structure: '{camera}/{date}',
				verify_checksums: verifyChecksums,
				detect_duplicates: detectDuplicates
			});
		}

		// Import pro SD-Karte
		const importIds: string[] = [];
		for (const sdCardId of resolvedSdCardIds) {
			const [imp] = await db.insert(imports).values({
				project_id: projectId,
				sd_card_id: sdCardId,
				status: 'running'
			}).returning();

			const sampleFiles = generateSampleFiles(imp.id, verifyChecksums, detectDuplicates);
			if (sampleFiles.length > 0) await db.insert(files).values(sampleFiles);

			const totalSize = sampleFiles.reduce((s, f) => s + f.size, 0);
			const duplicateCount = sampleFiles.filter(f => f.is_duplicate).length;

			await db.update(imports).set({
				status: 'completed',
				completed_at: new Date().toISOString(),
				file_count: sampleFiles.length,
				total_size: totalSize,
				duplicate_count: duplicateCount,
				error_count: 0
			}).where(eq(imports.id, imp.id));

			await db.insert(import_logs).values([
				{ import_id: imp.id, type: 'info', message: `${sampleFiles.length} Dateien gefunden und kopiert` },
				...(duplicateCount > 0 ? [{ import_id: imp.id, type: 'warning', message: `${duplicateCount} Duplikat(e) erkannt und übersprungen` }] : []),
				...(verifyChecksums ? [{ import_id: imp.id, type: 'info', message: 'Prüfsummen verifiziert – alle Dateien korrekt' }] : [])
			]);

			importIds.push(imp.id);
		}

		redirect(303, `/import/confirm?ids=${importIds.join(',')}`);
	}
};

function generateSampleFiles(importId: string, verify: number, detectDupes: number) {
	const cameras = ['SonyA7IV', 'SonyA7III', 'CanonR5'];
	const extensions = ['MP4', 'MP4', 'MP4', 'JPG', 'ARW'];
	const count = Math.floor(Math.random() * 30) + 10;
	const seen = new Set<string>();

	return Array.from({ length: count }, (_, i) => {
		const cam = cameras[Math.floor(Math.random() * cameras.length)];
		const ext = extensions[Math.floor(Math.random() * extensions.length)];
		const filename = `${cam}_${String(i + 1).padStart(4, '0')}.${ext}`;
		const isDuplicate = detectDupes && seen.has(filename) ? 1 : 0;
		seen.add(filename);

		return {
			import_id: importId,
			filename,
			path: `/media/${cam}/${filename}`,
			size: ext === 'MP4' ? Math.random() * 2 * 1024 ** 3 : Math.random() * 25 * 1024 ** 2,
			checksum: verify ? crypto.randomUUID().replace(/-/g, '') : null,
			exif_camera_model: cam,
			exif_iso: Math.floor(Math.random() * 3200) + 100,
			exif_shutter: `1/${Math.floor(Math.random() * 500) + 50}`,
			exif_focal_length: `${[24, 35, 50, 70, 85][Math.floor(Math.random() * 5)]}mm`,
			is_duplicate: isDuplicate
		};
	});
}
