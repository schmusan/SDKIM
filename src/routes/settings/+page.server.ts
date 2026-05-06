import { db } from '$lib/server/db';
import { import_templates, app_settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

const DEFAULTS: Record<string, string> = {
	folder_structure: '{camera}/{date}',
	verify_checksums: '1',
	detect_duplicates: '1',
	project_name_pattern: '{date}_Projekt',
	max_file_size_gb: '0'
};

async function getSetting(key: string): Promise<string> {
	const [row] = await db.select().from(app_settings).where(eq(app_settings.key, key));
	return row?.value ?? DEFAULTS[key] ?? '';
}

async function setSetting(key: string, value: string) {
	const existing = await db.select().from(app_settings).where(eq(app_settings.key, key));
	if (existing.length > 0) {
		await db.update(app_settings).set({ value }).where(eq(app_settings.key, key));
	} else {
		await db.insert(app_settings).values({ key, value });
	}
}

export async function load() {
	const templates = await db.select().from(import_templates);

	const settings = {
		folder_structure: await getSetting('folder_structure'),
		verify_checksums: await getSetting('verify_checksums') === '1',
		detect_duplicates: await getSetting('detect_duplicates') === '1',
		project_name_pattern: await getSetting('project_name_pattern'),
		max_file_size_gb: await getSetting('max_file_size_gb')
	};

	return { templates, settings };
}

export const actions = {
	saveSettings: async ({ request }) => {
		const data = await request.formData();

		await setSetting('folder_structure', (data.get('folder_structure') as string)?.trim() || DEFAULTS.folder_structure);
		await setSetting('verify_checksums', data.get('verify_checksums') === 'on' ? '1' : '0');
		await setSetting('detect_duplicates', data.get('detect_duplicates') === 'on' ? '1' : '0');
		await setSetting('project_name_pattern', (data.get('project_name_pattern') as string)?.trim() || DEFAULTS.project_name_pattern);
		await setSetting('max_file_size_gb', (data.get('max_file_size_gb') as string)?.trim() || '0');

		return { success: true };
	},
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
