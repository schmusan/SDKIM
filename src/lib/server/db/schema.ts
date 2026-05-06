import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	notes: text('notes'),
	created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const sd_cards = sqliteTable('sd_cards', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	label: text('label').notNull(),
	serial: text('serial'),
	created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const cameras = sqliteTable('cameras', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	model: text('model').notNull(),
	folder_pattern: text('folder_pattern').notNull()
});

export const imports = sqliteTable('imports', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	project_id: text('project_id').notNull().references(() => projects.id),
	sd_card_id: text('sd_card_id').notNull().references(() => sd_cards.id),
	status: text('status').notNull().default('pending'),
	started_at: text('started_at').notNull().$defaultFn(() => new Date().toISOString()),
	completed_at: text('completed_at'),
	file_count: integer('file_count').default(0),
	total_size: real('total_size').default(0),
	duplicate_count: integer('duplicate_count').default(0),
	error_count: integer('error_count').default(0)
});

export const files = sqliteTable('files', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	import_id: text('import_id').notNull().references(() => imports.id),
	filename: text('filename').notNull(),
	path: text('path').notNull(),
	size: real('size').notNull(),
	checksum: text('checksum'),
	camera_id: text('camera_id').references(() => cameras.id),
	exif_iso: integer('exif_iso'),
	exif_shutter: text('exif_shutter'),
	exif_focal_length: text('exif_focal_length'),
	exif_camera_model: text('exif_camera_model'),
	is_duplicate: integer('is_duplicate').default(0),
	created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const import_logs = sqliteTable('import_logs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	import_id: text('import_id').notNull().references(() => imports.id),
	type: text('type').notNull(),
	message: text('message').notNull(),
	created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

export const import_templates = sqliteTable('import_templates', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	folder_structure: text('folder_structure').notNull(),
	rename_files: integer('rename_files').default(0),
	verify_checksums: integer('verify_checksums').default(1),
	detect_duplicates: integer('detect_duplicates').default(1)
});
