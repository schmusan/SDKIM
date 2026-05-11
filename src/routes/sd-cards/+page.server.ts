import { getCollections, mapId } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { sd_cards, imports, projects } = await getCollections();

	const allCards = await sd_cards.find().sort({ created_at: -1 }).toArray();

	const stats = await imports
		.aggregate([
			{
				$group: {
					_id: '$sd_card_id',
					import_count: { $sum: 1 },
					total_size: { $sum: '$total_size' },
					file_count: { $sum: '$file_count' }
				}
			}
		])
		.toArray();

	const statsMap = Object.fromEntries(stats.map((s) => [s._id as string, s]));

	const allImports = await imports.find().sort({ started_at: -1 }).toArray();
	const projectIds = [...new Set(allImports.map((i) => i.project_id))];
	const projectDocs = await projects.find({ _id: { $in: projectIds } }).toArray();
	const projectMap = Object.fromEntries(projectDocs.map((p) => [p._id, p]));

	const historyMap: Record<string, object[]> = {};
	for (const imp of allImports) {
		if (!imp.sd_card_id) continue;
		if (!historyMap[imp.sd_card_id]) historyMap[imp.sd_card_id] = [];
		historyMap[imp.sd_card_id].push({
			...mapId(imp),
			project_name: projectMap[imp.project_id]?.name ?? null
		});
	}

	return {
		cards: allCards.map((c) => ({
			...mapId(c),
			stats: statsMap[c._id] ?? null,
			history: historyMap[c._id] ?? []
		}))
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const label = (data.get('label') as string)?.trim();
		const serial = (data.get('serial') as string)?.trim() || null;
		if (!label) return fail(400, { error: 'Label erforderlich' });
		const { sd_cards } = await getCollections();
		await sd_cards.insertOne({
			_id: crypto.randomUUID(),
			label,
			serial,
			created_at: new Date().toISOString()
		});
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const label = (data.get('label') as string)?.trim();
		const serial = (data.get('serial') as string)?.trim() || null;
		if (!label) return fail(400, { error: 'Label erforderlich' });
		const { sd_cards } = await getCollections();
		await sd_cards.updateOne({ _id: id }, { $set: { label, serial } });
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const { sd_cards } = await getCollections();
		await sd_cards.deleteOne({ _id: id });
	}
};
