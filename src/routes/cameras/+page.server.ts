import { db } from '$lib/server/db';
import { cameras, files } from '$lib/server/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const allCameras = await db.select().from(cameras).orderBy(cameras.model);

	const stats = await db
		.select({
			camera_id: files.camera_id,
			file_count: count(files.id)
		})
		.from(files)
		.groupBy(files.camera_id);

	const statsMap = Object.fromEntries(stats.map(s => [s.camera_id, s.file_count]));

	return {
		cameras: allCameras.map(c => ({ ...c, file_count: statsMap[c.id] ?? 0 }))
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		await db.insert(cameras).values({ model, folder_pattern });
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		await db.update(cameras).set({ model, folder_pattern }).where(eq(cameras.id, id));
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		await db.delete(cameras).where(eq(cameras.id, id));
	}
};
