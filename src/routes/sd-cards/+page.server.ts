import { db } from '$lib/server/db';
import { sd_cards, imports, projects } from '$lib/server/db/schema';
import { desc, eq, count, sum } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const allCards = await db.select().from(sd_cards).orderBy(desc(sd_cards.created_at));

	const stats = await db
		.select({
			sd_card_id: imports.sd_card_id,
			import_count: count(imports.id),
			total_size: sum(imports.total_size),
			file_count: sum(imports.file_count)
		})
		.from(imports)
		.groupBy(imports.sd_card_id);

	const statsMap = Object.fromEntries(stats.map(s => [s.sd_card_id, s]));

	const history = await db
		.select({
			id: imports.id,
			sd_card_id: imports.sd_card_id,
			status: imports.status,
			started_at: imports.started_at,
			file_count: imports.file_count,
			total_size: imports.total_size,
			project_name: projects.name,
			project_id: projects.id
		})
		.from(imports)
		.leftJoin(projects, eq(imports.project_id, projects.id))
		.orderBy(desc(imports.started_at));

	const historyMap: Record<string, typeof history> = {};
	for (const imp of history) {
		if (!imp.sd_card_id) continue;
		if (!historyMap[imp.sd_card_id]) historyMap[imp.sd_card_id] = [];
		historyMap[imp.sd_card_id].push(imp);
	}

	return {
		cards: allCards.map(c => ({
			...c,
			stats: statsMap[c.id] ?? null,
			history: historyMap[c.id] ?? []
		}))
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const label = (data.get('label') as string)?.trim();
		const serial = (data.get('serial') as string)?.trim() || null;
		if (!label) return fail(400, { error: 'Label erforderlich' });
		await db.insert(sd_cards).values({ label, serial });
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const label = (data.get('label') as string)?.trim();
		const serial = (data.get('serial') as string)?.trim() || null;
		if (!label) return fail(400, { error: 'Label erforderlich' });
		await db.update(sd_cards).set({ label, serial }).where(eq(sd_cards.id, id));
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		await db.delete(sd_cards).where(eq(sd_cards.id, id));
	}
};
