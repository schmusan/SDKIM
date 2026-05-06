import { db } from '$lib/server/db';
import { projects, imports, sd_cards, files, import_logs } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export async function load({ params }) {
	const [project] = await db.select().from(projects).where(eq(projects.id, params.id));
	if (!project) error(404, 'Projekt nicht gefunden');

	const projectImports = await db
		.select({
			id: imports.id,
			status: imports.status,
			started_at: imports.started_at,
			completed_at: imports.completed_at,
			file_count: imports.file_count,
			total_size: imports.total_size,
			duplicate_count: imports.duplicate_count,
			error_count: imports.error_count,
			sd_card_label: sd_cards.label
		})
		.from(imports)
		.leftJoin(sd_cards, eq(imports.sd_card_id, sd_cards.id))
		.where(eq(imports.project_id, params.id))
		.orderBy(desc(imports.started_at));

	const importIds = projectImports.map(i => i.id);
	const projectFiles = importIds.length > 0
		? await db.select().from(files).where(inArray(files.import_id, importIds))
		: [];

	const logs = importIds.length > 0
		? await db.select().from(import_logs).where(inArray(import_logs.import_id, importIds)).orderBy(desc(import_logs.created_at))
		: [];

	return { project, projectImports, projectFiles, logs };
}

export const actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		if (!name) return fail(400, { error: 'Projektname erforderlich' });
		await db.update(projects).set({ name, notes }).where(eq(projects.id, params.id));
	}
};
