import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';
import type {
	ProjectDoc,
	SdCardDoc,
	CameraDoc,
	ImportDoc,
	FileDoc,
	ImportLogDoc,
	AppSettingDoc,
	ImportTemplateDoc
} from './schema';

let _client: MongoClient | null = null;
let _connPromise: Promise<MongoClient> | null = null;

async function getDb() {
	const uri = env.MONGODB_URI;
	if (!uri) throw new Error('MONGODB_URI is not set');

	if (!_client) {
		_client = new MongoClient(uri);
		_connPromise = _client.connect();
	}

	await _connPromise;
	return _client.db('SDKIM');
}

export async function getCollections() {
	const db = await getDb();
	return {
		projects: db.collection<ProjectDoc>('projects'),
		sd_cards: db.collection<SdCardDoc>('sd_cards'),
		cameras: db.collection<CameraDoc>('cameras'),
		imports: db.collection<ImportDoc>('imports'),
		files: db.collection<FileDoc>('files'),
		import_logs: db.collection<ImportLogDoc>('import_logs'),
		app_settings: db.collection<AppSettingDoc>('app_settings'),
		import_templates: db.collection<ImportTemplateDoc>('import_templates')
	};
}

export function mapId<T extends { _id: string }>(doc: T): T & { id: string } {
	return { ...doc, id: doc._id };
}
