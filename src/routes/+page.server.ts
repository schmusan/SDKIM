import { db } from '$lib/server/db';
import { projects, imports, sd_cards, files } from '$lib/server/db/schema';
import { desc, count, sum, eq } from 'drizzle-orm';

export async function load() {
	const recentProjects = await db
		.select()
		.from(projects)
		.orderBy(desc(projects.created_at))
		.limit(5);

	const recentSdCards = await db
		.select()
		.from(sd_cards)
		.orderBy(desc(sd_cards.created_at))
		.limit(5);

	const recentImports = await db
		.select({
			id: imports.id,
			status: imports.status,
			started_at: imports.started_at,
			completed_at: imports.completed_at,
			file_count: imports.file_count,
			total_size: imports.total_size,
			error_count: imports.error_count,
			project_name: projects.name,
			sd_card_label: sd_cards.label
		})
		.from(imports)
		.leftJoin(projects, eq(imports.project_id, projects.id))
		.leftJoin(sd_cards, eq(imports.sd_card_id, sd_cards.id))
		.orderBy(desc(imports.started_at))
		.limit(5);

	const [projectCount] = await db.select({ value: count() }).from(projects);
	const [importCount] = await db.select({ value: count() }).from(imports);
	const [fileCount] = await db.select({ value: count() }).from(files);
	const [totalSize] = await db.select({ value: sum(imports.total_size) }).from(imports);

	return {
		recentProjects,
		recentSdCards,
		recentImports,
		stats: {
			projects: projectCount.value,
			imports: importCount.value,
			files: fileCount.value,
			totalSizeGb: totalSize.value ? (Number(totalSize.value) / 1024 / 1024 / 1024).toFixed(1) : '0'
		}
	};
}
