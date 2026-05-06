import { db } from '$lib/server/db';
import { projects, imports, files } from '$lib/server/db/schema';
import { desc, eq, count, sum, like, or } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ url }) {
	const search = url.searchParams.get('q') ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';

	const allProjects = await db
		.select({
			id: projects.id,
			name: projects.name,
			notes: projects.notes,
			created_at: projects.created_at
		})
		.from(projects)
		.where(search ? like(projects.name, `%${search}%`) : undefined)
		.orderBy(sort === 'name' ? projects.name : desc(projects.created_at));

	// Import-Statistiken pro Projekt
	const stats = await db
		.select({
			project_id: imports.project_id,
			import_count: count(imports.id),
			total_size: sum(imports.total_size),
			file_count: sum(imports.file_count)
		})
		.from(imports)
		.groupBy(imports.project_id);

	const statsMap = Object.fromEntries(stats.map(s => [s.project_id, s]));

	return {
		projects: allProjects.map(p => ({ ...p, stats: statsMap[p.id] ?? null })),
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
		const [created] = await db.insert(projects).values({ name, notes }).returning();
		redirect(303, `/projects/${created.id}`);
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Keine ID angegeben' });
		await db.delete(projects).where(eq(projects.id, id));
	}
};
