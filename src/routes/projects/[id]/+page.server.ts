import { getCollections, mapId } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';

export async function load({ params }) {
	const { projects, imports, sd_cards, files, import_logs } = await getCollections();

	const project = await projects.findOne({ _id: params.id });
	if (!project) error(404, 'Projekt nicht gefunden');

	const projectImportDocs = await imports
		.find({ project_id: params.id })
		.sort({ started_at: -1 })
		.toArray();

	const sdCardIds = [...new Set(projectImportDocs.map((i) => i.sd_card_id))];
	const sdCardDocs = await sd_cards.find({ _id: { $in: sdCardIds } }).toArray();
	const sdCardMap = Object.fromEntries(sdCardDocs.map((c) => [c._id, c.label]));

	const projectImports = projectImportDocs.map((imp) => ({
		...mapId(imp),
		sd_card_label: sdCardMap[imp.sd_card_id] ?? null
	}));

	const importIds = projectImportDocs.map((i) => i._id);
	const [projectFiles, logs] = await Promise.all([
		importIds.length > 0 ? files.find({ import_id: { $in: importIds } }).toArray() : [],
		importIds.length > 0
			? import_logs
					.find({ import_id: { $in: importIds } })
					.sort({ created_at: -1 })
					.toArray()
			: []
	]);

	return {
		project: mapId(project),
		projectImports,
		projectFiles: projectFiles.map(mapId),
		logs: logs.map(mapId)
	};
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		if (!name) return fail(400, { error: 'Projektname erforderlich' });
		const { projects } = await getCollections();
		await projects.updateOne({ _id: params.id }, { $set: { name, notes } });
	}
};
