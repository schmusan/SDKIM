import { getCollections, mapId } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ url }) {
	const search = url.searchParams.get('q') ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const { projects, imports } = await getCollections();

	const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
	const sortOpt = sort === 'name' ? { name: 1 as const } : { created_at: -1 as const };

	const allProjects = await projects.find(filter).sort(sortOpt).toArray();

	const stats = await imports
		.aggregate([
			{
				$group: {
					_id: '$project_id',
					import_count: { $sum: 1 },
					total_size: { $sum: '$total_size' },
					file_count: { $sum: '$file_count' }
				}
			}
		])
		.toArray();

	const statsMap = Object.fromEntries(stats.map((s) => [s._id, s]));

	return {
		projects: allProjects.map((p) => ({ ...mapId(p), stats: statsMap[p._id] ?? null })),
		search,
		sort
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		if (!name) return fail(400, { error: 'Projektname erforderlich' });
		const { projects } = await getCollections();
		const id = crypto.randomUUID();
		await projects.insertOne({ _id: id, name, notes, created_at: new Date().toISOString() });
		redirect(303, `/projects/${id}`);
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Keine ID angegeben' });
		const { projects } = await getCollections();
		await projects.deleteOne({ _id: id });
	}
};
