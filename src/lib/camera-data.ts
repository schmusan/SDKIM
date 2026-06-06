// Realistische Objektive pro Hersteller für die Simulation (auch fürs Dashboard sichtbar)
export const LENSES_BY_BRAND: Record<string, string[]> = {
	Sony: [
		'FE 24-70mm f/2.8 GM II',
		'FE 70-200mm f/2.8 GM OSS II',
		'FE 16-35mm f/2.8 GM',
		'FE 85mm f/1.4 GM',
		'FE 50mm f/1.2 GM',
		'FE 35mm f/1.4 GM',
		'FE 100-400mm f/4.5-5.6 GM',
		'FE 24mm f/1.4 GM'
	],
	Canon: [
		'RF 24-70mm f/2.8L IS USM',
		'RF 70-200mm f/2.8L IS USM',
		'RF 50mm f/1.2L USM',
		'RF 85mm f/1.2L USM',
		'RF 28-70mm f/2L USM',
		'RF 100-500mm f/4.5-7.1L IS USM',
		'RF 15-35mm f/2.8L IS USM'
	],
	Nikon: [
		'Z 24-70mm f/2.8 S',
		'Z 70-200mm f/2.8 VR S',
		'Z 50mm f/1.2 S',
		'Z 85mm f/1.2 S',
		'Z 14-24mm f/2.8 S',
		'Z 100-400mm f/4.5-5.6 VR S',
		'Z 35mm f/1.8 S'
	],
	Panasonic: [
		'Lumix S 24-70mm f/2.8',
		'Lumix S 70-200mm f/2.8 OIS',
		'Lumix S 50mm f/1.4',
		'Lumix S 85mm f/1.8',
		'Lumix S 18mm f/1.8'
	],
	Sigma: [
		'24-70mm f/2.8 DG DN II ART',
		'35mm f/1.2 DG DN ART',
		'14-24mm f/2.8 DG DN ART',
		'85mm f/1.4 DG DN ART'
	],
	Leica: [
		'Summicron-SL 50mm f/2 ASPH',
		'Vario-Elmarit-SL 24-90mm f/2.8-4 ASPH',
		'Summilux-SL 50mm f/1.4 ASPH',
		'APO-Summicron-SL 75mm f/2 ASPH'
	],
	Pentax: [
		'HD D FA 24-70mm f/2.8 ED SDM WR',
		'HD D FA 70-200mm f/2.8 ED DC AW',
		'HD D FA 50mm f/1.4 SDM AW'
	],
	Hasselblad: [
		'XCD 45mm f/4 P',
		'XCD 65mm f/2.8',
		'XCD 90mm f/2.5 V',
		'XCD 25mm f/2.5 V'
	]
};

const DEFAULT_LENSES = ['24-70mm f/2.8', '70-200mm f/2.8', '50mm f/1.4', '85mm f/1.8'];

export function getBrand(model: string): string {
	const m = model.toLowerCase();
	if (m.startsWith('sony')) return 'Sony';
	if (m.startsWith('canon')) return 'Canon';
	if (m.startsWith('nikon')) return 'Nikon';
	if (m.startsWith('panasonic') || m.startsWith('lumix')) return 'Panasonic';
	if (m.startsWith('sigma')) return 'Sigma';
	if (m.startsWith('leica')) return 'Leica';
	if (m.startsWith('pentax')) return 'Pentax';
	if (m.startsWith('hasselblad')) return 'Hasselblad';
	if (m.startsWith('fujifilm') || m.startsWith('fuji')) return 'Fujifilm';
	return 'Generisch';
}

export function getLensesForCamera(model: string): string[] {
	const brand = getBrand(model);
	return LENSES_BY_BRAND[brand] ?? DEFAULT_LENSES;
}

export function pickRandomLens(model: string): string {
	const lenses = getLensesForCamera(model);
	return lenses[Math.floor(Math.random() * lenses.length)];
}

// Echte Dateinamen-Konventionen pro Hersteller
export interface NamingScheme {
	photoExt: string;
	videoExt: string;
	photoPrefix: (n: number) => string;
	videoPrefix: (n: number) => string;
}

const SCHEMES: Record<string, NamingScheme> = {
	Sony: {
		photoExt: 'ARW',
		videoExt: 'MP4',
		photoPrefix: (n) => `DSC0${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `C${String(n).padStart(4, '0')}`
	},
	Canon: {
		photoExt: 'CR3',
		videoExt: 'MP4',
		photoPrefix: (n) => `IMG_${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `MVI_${String(n).padStart(4, '0')}`
	},
	Nikon: {
		photoExt: 'NEF',
		videoExt: 'MOV',
		photoPrefix: (n) => `DSC_${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `DSC_${String(n).padStart(4, '0')}`
	},
	Panasonic: {
		photoExt: 'RW2',
		videoExt: 'MP4',
		photoPrefix: (n) => `P101${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `P101${String(n).padStart(4, '0')}`
	},
	Sigma: {
		photoExt: 'DNG',
		videoExt: 'MOV',
		photoPrefix: (n) => `SDIM${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `SDIM${String(n).padStart(4, '0')}`
	},
	Leica: {
		photoExt: 'DNG',
		videoExt: 'MP4',
		photoPrefix: (n) => `L101${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `L101${String(n).padStart(4, '0')}`
	},
	Pentax: {
		photoExt: 'PEF',
		videoExt: 'AVI',
		photoPrefix: (n) => `IMGP${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `IMGP${String(n).padStart(4, '0')}`
	},
	Hasselblad: {
		photoExt: '3FR',
		videoExt: 'MP4',
		photoPrefix: (n) => `B000${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `B000${String(n).padStart(4, '0')}`
	},
	Fujifilm: {
		photoExt: 'RAF',
		videoExt: 'MOV',
		photoPrefix: (n) => `DSCF${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `DSCF${String(n).padStart(4, '0')}`
	},
	Generisch: {
		photoExt: 'JPG',
		videoExt: 'MP4',
		photoPrefix: (n) => `IMG${String(n).padStart(4, '0')}`,
		videoPrefix: (n) => `MOV${String(n).padStart(4, '0')}`
	}
};

export function getNamingScheme(model: string): NamingScheme {
	return SCHEMES[getBrand(model)] ?? SCHEMES.Generisch;
}
