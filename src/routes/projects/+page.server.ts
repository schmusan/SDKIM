import { getCollections, mapId } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ url }) {
	const search = url.searchParams.get('q') ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const cameraFilter = url.searchParams.get('camera') ?? '';
	const lensFilter = url.searchParams.get('lens') ?? '';
	const { projects, imports, files } = await getCollections();

	// Filteroptionen für Dropdowns (alle distinkten Kameras und Objektive aus den Files)
	const [cameraOptionsRaw, lensOptionsRaw] = await Promise.all([
		files.distinct('exif_camera_model'),
		files.distinct('exif_focal_length')
	]);
	const cameraOptions = cameraOptionsRaw.filter((v): v is string => typeof v === 'string').sort();
	const lensOptions = lensOptionsRaw.filter((v): v is string => typeof v === 'string').sort();

	// Wenn nach Kamera oder Objektiv gefiltert wird:
	// Files → Import-IDs → Project-IDs → Projekte
	let projectIdRestriction: string[] | null = null;
	if (cameraFilter || lensFilter) {
		const fileMatch: Record<string, string> = {};
		if (cameraFilter) fileMatch.exif_camera_model = cameraFilter;
		if (lensFilter) fileMatch.exif_focal_length = lensFilter;
		const matchingFiles = await files
			.find(fileMatch, { projection: { import_id: 1 } })
			.toArray();
		const importIds = [...new Set(matchingFiles.map((f) => f.import_id))];
		if (importIds.length === 0) {
			projectIdRestriction = [];
		} else {
			const matchingImports = await imports
				.find({ _id: { $in: importIds } }, { projection: { project_id: 1 } })
				.toArray();
			projectIdRestriction = [...new Set(matchingImports.map((i) => i.project_id))];
		}
	}

	const filter: Record<string, unknown> = {};
	if (search) filter.name = { $regex: search, $options: 'i' };
	if (projectIdRestriction !== null) filter._id = { $in: projectIdRestriction };

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
		sort,
		cameraFilter,
		lensFilter,
		cameraOptions,
		lensOptions
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
