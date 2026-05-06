import { db } from '$lib/server/db';
import { imports, files, projects, sd_cards } from '$lib/server/db/schema';
import { desc, eq, count, sum } from 'drizzle-orm';

export async function load() {
	// Imports pro Tag (letzte 30 Tage)
	const allImports = await db
		.select({
			started_at: imports.started_at,
			file_count: imports.file_count,
			total_size: imports.total_size,
			duplicate_count: imports.duplicate_count
		})
		.from(imports)
		.orderBy(imports.started_at);

	// Speicher pro Projekt
	const projectStats = await db
		.select({
			name: projects.name,
			total_size: sum(imports.total_size),
			file_count: sum(imports.file_count),
			import_count: count(imports.id)
		})
		.from(projects)
		.leftJoin(imports, eq(imports.project_id, projects.id))
		.groupBy(projects.id)
		.orderBy(desc(sum(imports.total_size)));

	// Dateien nach Kamera
	const byCamera = await db
		.select({
			camera: files.exif_camera_model,
			file_count: count(files.id),
			total_size: sum(files.size)
		})
		.from(files)
		.groupBy(files.exif_camera_model)
		.orderBy(desc(count(files.id)));

	// Dateien nach Format
	const allFiles = await db.select({ filename: files.filename, size: files.size }).from(files);
	const byFormat: Record<string, { count: number; size: number }> = {};
	for (const f of allFiles) {
		const ext = f.filename.split('.').pop()?.toUpperCase() ?? '?';
		if (!byFormat[ext]) byFormat[ext] = { count: 0, size: 0 };
		byFormat[ext].count++;
		byFormat[ext].size += f.size;
	}

	// Gesamtzahlen
	const [totals] = await db.select({
		total_files: count(files.id),
		total_size: sum(files.size)
	}).from(files);

	const [importTotals] = await db.select({
		total_imports: count(imports.id),
		total_duplicates: sum(imports.duplicate_count)
	}).from(imports);

	// Importe gruppiert nach Datum
	const byDay: Record<string, number> = {};
	for (const imp of allImports) {
		const day = imp.started_at.slice(0, 10);
		byDay[day] = (byDay[day] ?? 0) + (imp.file_count ?? 0);
	}

	return {
		totals: {
			files: totals.total_files ?? 0,
			size: Number(totals.total_size ?? 0),
			imports: importTotals.total_imports ?? 0,
			duplicates: Number(importTotals.total_duplicates ?? 0)
		},
		projectStats: projectStats.map(p => ({
			name: p.name,
			total_size: Number(p.total_size ?? 0),
			file_count: Number(p.file_count ?? 0),
			import_count: p.import_count
		})),
		byCamera: byCamera.map(c => ({
			camera: c.camera ?? 'Unbekannt',
			file_count: c.file_count,
			total_size: Number(c.total_size ?? 0)
		})),
		byFormat,
		byDay
	};
}
