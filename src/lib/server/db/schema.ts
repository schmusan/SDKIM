export interface ProjectDoc {
	_id: string;
	name: string;
	notes?: string | null;
	created_at: string;
}

export interface SdCardDoc {
	_id: string;
	label: string;
	serial?: string | null;
	created_at: string;
}

export interface CameraDoc {
	_id: string;
	model: string;
	folder_pattern: string;
	lenses?: string[];
}

export interface ImportDoc {
	_id: string;
	project_id: string;
	sd_card_id: string;
	status: string;
	started_at: string;
	completed_at?: string | null;
	file_count: number;
	total_size: number;
	duplicate_count: number;
	error_count: number;
}

export interface FileDoc {
	_id: string;
	import_id: string;
	filename: string;
	path: string;
	size: number;
	checksum?: string | null;
	camera_id?: string | null;
	exif_iso?: number | null;
	exif_shutter?: string | null;
	exif_focal_length?: string | null;
	exif_camera_model?: string | null;
	is_duplicate: boolean;
	created_at: string;
}

export interface ImportLogDoc {
	_id: string;
	import_id: string;
	type: string;
	message: string;
	created_at: string;
}

export interface AppSettingDoc {
	_id: string;
	value: string;
}

export interface ImportTemplateDoc {
	_id: string;
	name: string;
	folder_structure: string;
	rename_files: boolean;
	verify_checksums: boolean;
	detect_duplicates: boolean;
}
