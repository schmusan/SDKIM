import { getCollections, mapId } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

const DEFAULTS: Record<string, string> = {
	folder_structure: '{camera}/{date}',
	verify_checksums: '1',
	detect_duplicates: '1',
	project_name_pattern: '{date}_Projekt',
	max_file_size_gb: '0'
};

async function getSetting(key: string): Promise<string> {
	const { app_settings } = await getCollections();
	const doc = await app_settings.findOne({ _id: key });
	return doc?.value ?? DEFAULTS[key] ?? '';
}

async function setSetting(key: string, value: string) {
	const { app_settings } = await getCollections();
	await app_settings.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
}

export async function load() {
	const { import_templates } = await getCollections();
	const templates = await import_templates.find().toArray();

	const settings = {
		folder_structure: await getSetting('folder_structure'),
		verify_checksums: (await getSetting('verify_checksums')) === '1',
		detect_duplicates: (await getSetting('detect_duplicates')) === '1',
		project_name_pattern: await getSetting('project_name_pattern'),
		max_file_size_gb: await getSetting('max_file_size_gb')
	};

	return { templates: templates.map(mapId), settings };
}

export const actions = {
	saveSettings: async ({ request }) => {
		const data = await request.formData();
		await setSetting(
			'folder_structure',
			(data.get('folder_structure') as string)?.trim() || DEFAULTS.folder_structure
		);
		await setSetting('verify_checksums', data.get('verify_checksums') === 'on' ? '1' : '0');
		await setSetting('detect_duplicates', data.get('detect_duplicates') === 'on' ? '1' : '0');
		await setSetting(
			'project_name_pattern',
			(data.get('project_name_pattern') as string)?.trim() || DEFAULTS.project_name_pattern
		);
		await setSetting('max_file_size_gb', (data.get('max_file_size_gb') as string)?.trim() || '0');
		return { success: true };
	},
	createTemplate: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const folder_structure = (data.get('folder_structure') as string)?.trim();
		if (!name || !folder_structure) return fail(400, { error: 'Alle Felder erforderlich' });
		const { import_templates } = await getCollections();
		await import_templates.insertOne({
			_id: crypto.randomUUID(),
			name,
			folder_structure,
			verify_checksums: data.get('verify_checksums') === 'on',
			detect_duplicates: data.get('detect_duplicates') === 'on',
			rename_files: data.get('rename_files') === 'on'
		});
	},
	deleteTemplate: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const { import_templates } = await getCollections();
		await import_templates.deleteOne({ _id: id });
	}
};
