import { getCollections, mapId } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
	if (ids.length === 0) error(400, 'Keine Import-IDs angegeben');

	const { imports, projects, sd_cards, files } = await getCollections();

	const importDocs = await imports.find({ _id: { $in: ids } }).toArray();
	const projectIds = [...new Set(importDocs.map((i) => i.project_id))];
	const sdCardIds = [...new Set(importDocs.map((i) => i.sd_card_id))];

	const [projectDocs, sdCardDocs] = await Promise.all([
		projects.find({ _id: { $in: projectIds } }).toArray(),
		sd_cards.find({ _id: { $in: sdCardIds } }).toArray()
	]);

	const projectMap = Object.fromEntries(projectDocs.map((p) => [p._id, p.name]));
	const sdCardMap = Object.fromEntries(sdCardDocs.map((c) => [c._id, c.label]));

	const importList = importDocs.map((imp) => ({
		...mapId(imp),
		project_name: projectMap[imp.project_id] ?? null,
		sd_card_label: sdCardMap[imp.sd_card_id] ?? null
	}));

	const sampleFiles = await files
		.find({ import_id: { $in: ids } }, { projection: { filename: 1 } })
		.limit(40)
		.toArray();

	return {
		importIds: ids,
		importList,
		sampleFiles: sampleFiles.map((f) => f.filename)
	};
}
