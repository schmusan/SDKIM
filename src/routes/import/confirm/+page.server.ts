import { db } from '$lib/server/db';
import { imports, sd_cards, projects, files, import_logs } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
	if (ids.length === 0) error(400, 'Keine Import-IDs angegeben');

	const importList = await db
		.select({
			id: imports.id,
			status: imports.status,
			started_at: imports.started_at,
			completed_at: imports.completed_at,
			file_count: imports.file_count,
			total_size: imports.total_size,
			duplicate_count: imports.duplicate_count,
			error_count: imports.error_count,
			project_name: projects.name,
			project_id: projects.id,
			sd_card_label: sd_cards.label
		})
		.from(imports)
		.leftJoin(projects, eq(imports.project_id, projects.id))
		.leftJoin(sd_cards, eq(imports.sd_card_id, sd_cards.id))
		.where(inArray(imports.id, ids));

	const importedFiles = await db
		.select()
		.from(files)
		.where(inArray(files.import_id, ids));

	const logs = await db
		.select()
		.from(import_logs)
		.where(inArray(import_logs.import_id, ids));

	return { importList, importedFiles, logs };
}
