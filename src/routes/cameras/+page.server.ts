import { getCollections, mapId } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { cameras, files, imports, projects, sd_cards } = await getCollections();

	const allCameras = await cameras.find().sort({ model: 1 }).toArray();

	// Pro Kameramodell: alle Imports, in denen Dateien dieses Modells vorkommen
	// 1. Group files by (camera, import) → file_count + total_size
	const fileAggByCameraImport = await files
		.aggregate([
			{
				$group: {
					_id: { cam: '$exif_camera_model', imp: '$import_id' },
					file_count: { $sum: 1 },
					total_size: { $sum: '$size' }
				}
			}
		])
		.toArray();

	const importIds = [
		...new Set(fileAggByCameraImport.map((r) => (r._id as { imp: string }).imp))
	];

	const [importDocs, projectDocs, sdCardDocs] = await Promise.all([
		imports.find({ _id: { $in: importIds } }).toArray(),
		projects.find().toArray(),
		sd_cards.find().toArray()
	]);

	const importMap = Object.fromEntries(importDocs.map((i) => [i._id, i]));
	const projectMap = Object.fromEntries(projectDocs.map((p) => [p._id, p.name]));
	const sdCardMap = Object.fromEntries(sdCardDocs.map((c) => [c._id, c.label]));

	// Alle Files je Kamera + Import laden (für die Sub-Liste pro Import)
	const allFiles = await files
		.find(
			{},
			{ projection: { _id: 1, filename: 1, size: 1, import_id: 1, exif_camera_model: 1 } }
		)
		.toArray();

	type FileRow = { id: string; filename: string; size: number };
	const filesByImport: Record<string, FileRow[]> = {};
	for (const f of allFiles) {
		const importId = f.import_id as string;
		if (!importId) continue;
		(filesByImport[importId] ??= []).push({
			id: f._id as string,
			filename: f.filename as string,
			size: (f.size as number) ?? 0
		});
	}
	// Filenames innerhalb eines Imports natürlich sortieren
	for (const list of Object.values(filesByImport)) {
		list.sort((a, b) => a.filename.localeCompare(b.filename));
	}

	// pro Kamera: Liste der Imports + Aggregate (jetzt mit Files je Import)
	type ImportRow = {
		id: string;
		project_name: string | null;
		sd_card_label: string | null;
		started_at: string;
		file_count: number;
		total_size: number;
		files: FileRow[];
	};
	const importsByCamera: Record<string, ImportRow[]> = {};
	const totalsByCamera: Record<string, { imports: number; files: number; size: number }> = {};

	for (const row of fileAggByCameraImport) {
		const cam = (row._id as { cam: string }).cam;
		const impId = (row._id as { imp: string }).imp;
		if (!cam || !impId) continue;
		const imp = importMap[impId];
		if (!imp) continue;

		(importsByCamera[cam] ??= []).push({
			id: impId,
			project_name: projectMap[imp.project_id] ?? null,
			sd_card_label: sdCardMap[imp.sd_card_id] ?? null,
			started_at: imp.started_at,
			file_count: row.file_count as number,
			total_size: row.total_size as number,
			files: filesByImport[impId] ?? []
		});
		const totals = (totalsByCamera[cam] ??= { imports: 0, files: 0, size: 0 });
		totals.imports += 1;
		totals.files += row.file_count as number;
		totals.size += row.total_size as number;
	}

	for (const list of Object.values(importsByCamera)) {
		list.sort((a, b) => b.started_at.localeCompare(a.started_at));
	}

	return {
		cameras: allCameras.map((c) => ({
			...mapId(c),
			lenses: (c.lenses ?? []) as string[],
			imports: importsByCamera[c.model] ?? [],
			totals: totalsByCamera[c.model] ?? { imports: 0, files: 0, size: 0 }
		}))
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		const { cameras } = await getCollections();
		await cameras.insertOne({ _id: crypto.randomUUID(), model, folder_pattern, lenses: [] });
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		const { cameras } = await getCollections();
		await cameras.updateOne({ _id: id }, { $set: { model, folder_pattern } });
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const { cameras } = await getCollections();
		await cameras.deleteOne({ _id: id });
	}
};
