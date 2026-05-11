import { getCollections } from '$lib/server/db';

export async function load() {
	const { imports, files, projects } = await getCollections();

	const [allImports, allProjects] = await Promise.all([
		imports.find().sort({ started_at: 1 }).toArray(),
		projects.find().toArray()
	]);

	// Speicher pro Projekt
	const importsByProject = await imports
		.aggregate([
			{
				$group: {
					_id: '$project_id',
					total_size: { $sum: '$total_size' },
					file_count: { $sum: '$file_count' },
					import_count: { $sum: 1 }
				}
			}
		])
		.toArray();

	const projectMap = Object.fromEntries(allProjects.map((p) => [p._id, p.name]));

	const projectStats = importsByProject
		.map((s) => ({
			name: projectMap[s._id as string] ?? 'Unbekannt',
			total_size: s.total_size as number,
			file_count: s.file_count as number,
			import_count: s.import_count as number
		}))
		.sort((a, b) => b.total_size - a.total_size);

	// Dateien nach Kamera
	const byCameraRaw = await files
		.aggregate([
			{
				$group: {
					_id: '$exif_camera_model',
					file_count: { $sum: 1 },
					total_size: { $sum: '$size' }
				}
			},
			{ $sort: { file_count: -1 } }
		])
		.toArray();

	const byCamera = byCameraRaw.map((c) => ({
		camera: (c._id as string) ?? 'Unbekannt',
		file_count: c.file_count as number,
		total_size: c.total_size as number
	}));

	// Dateien nach Format (in JS)
	const allFiles = await files.find({}, { projection: { filename: 1, size: 1 } }).toArray();
	const byFormat: Record<string, { count: number; size: number }> = {};
	for (const f of allFiles) {
		const ext = f.filename.split('.').pop()?.toUpperCase() ?? '?';
		if (!byFormat[ext]) byFormat[ext] = { count: 0, size: 0 };
		byFormat[ext].count++;
		byFormat[ext].size += f.size;
	}

	// Gesamtzahlen
	const [fileCount, sizeResult, importCount, dupResult] = await Promise.all([
		files.countDocuments(),
		files.aggregate([{ $group: { _id: null, total: { $sum: '$size' } } }]).toArray(),
		imports.countDocuments(),
		imports.aggregate([{ $group: { _id: null, total: { $sum: '$duplicate_count' } } }]).toArray()
	]);

	// Importe nach Tag
	const byDay: Record<string, number> = {};
	for (const imp of allImports) {
		const day = imp.started_at.slice(0, 10);
		byDay[day] = (byDay[day] ?? 0) + (imp.file_count ?? 0);
	}

	return {
		totals: {
			files: fileCount,
			size: (sizeResult[0] as { total?: number } | undefined)?.total ?? 0,
			imports: importCount,
			duplicates: (dupResult[0] as { total?: number } | undefined)?.total ?? 0
		},
		projectStats,
		byCamera,
		byFormat,
		byDay
	};
}
