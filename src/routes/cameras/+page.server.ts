import { getCollections, mapId } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { cameras, files } = await getCollections();

	const allCameras = await cameras.find().sort({ model: 1 }).toArray();

	const stats = await files
		.aggregate([{ $group: { _id: '$exif_camera_model', file_count: { $sum: 1 } } }])
		.toArray();

	const statsMap = Object.fromEntries(
		stats.map((s) => [s._id as string, s.file_count as number])
	);

	return {
		cameras: allCameras.map((c) => ({ ...mapId(c), file_count: statsMap[c.model] ?? 0 }))
	};
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		const { cameras } = await getCollections();
		await cameras.insertOne({ _id: crypto.randomUUID(), model, folder_pattern });
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const model = (data.get('model') as string)?.trim();
		const folder_pattern = (data.get('folder_pattern') as string)?.trim();
		if (!model || !folder_pattern) return fail(400, { error: 'Alle Felder erforderlich' });
		const { cameras } = await getCollections();
		await cameras.updateOne({ _id: id }, { $set: { model, folder_pattern } });
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const { cameras } = await getCollections();
		await cameras.deleteOne({ _id: id });
	}
};
