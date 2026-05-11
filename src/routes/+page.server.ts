import { getCollections, mapId } from '$lib/server/db';

export async function load() {
	const { projects, sd_cards, imports } = await getCollections();

	const [recentProjects, recentSdCards, recentImportDocs] = await Promise.all([
		projects.find().sort({ created_at: -1 }).limit(5).toArray(),
		sd_cards.find().sort({ created_at: -1 }).limit(5).toArray(),
		imports.find().sort({ started_at: -1 }).limit(5).toArray()
	]);

	const projectIds = [...new Set(recentImportDocs.map((i) => i.project_id))];
	const sdCardIds = [...new Set(recentImportDocs.map((i) => i.sd_card_id))];

	const [projectDocs, sdCardDocs] = await Promise.all([
		projects.find({ _id: { $in: projectIds } }).toArray(),
		sd_cards.find({ _id: { $in: sdCardIds } }).toArray()
	]);

	const projectMap = Object.fromEntries(projectDocs.map((p) => [p._id, p.name]));
	const sdCardMap = Object.fromEntries(sdCardDocs.map((c) => [c._id, c.label]));

	const [projectCount, importCount, fileCount] = await Promise.all([
		projects.countDocuments(),
		imports.countDocuments(),
		(await getCollections()).files.countDocuments()
	]);

	const sizeResult = await imports
		.aggregate([{ $group: { _id: null, total: { $sum: '$total_size' } } }])
		.toArray();
	const totalSize = (sizeResult[0] as { total?: number } | undefined)?.total ?? 0;

	return {
		recentProjects: recentProjects.map(mapId),
		recentSdCards: recentSdCards.map(mapId),
		recentImports: recentImportDocs.map((imp) => ({
			...mapId(imp),
			project_name: projectMap[imp.project_id] ?? null,
			sd_card_label: sdCardMap[imp.sd_card_id] ?? null
		})),
		stats: {
			projects: projectCount,
			imports: importCount,
			files: fileCount,
			totalSizeGb: (totalSize / 1073741824).toFixed(1)
		}
	};
}
