import { db } from '$lib/server/db';
import { import_templates } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load() {
	const templates = await db.select().from(import_templates);
	return { templates };
}

export const actions = {
	createTemplate: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const folder_structure = (data.get('folder_structure') as string)?.trim();
		if (!name || !folder_structure) return fail(400, { error: 'Alle Felder erforderlich' });
		await db.insert(import_templates).values({
			name,
			folder_structure,
			verify_checksums: data.get('verify_checksums') === 'on' ? 1 : 0,
			detect_duplicates: data.get('detect_duplicates') === 'on' ? 1 : 0,
			rename_files: data.get('rename_files') === 'on' ? 1 : 0
		});
	},
	deleteTemplate: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		await db.delete(import_templates).where(eq(import_templates.id, id));
	}
};
