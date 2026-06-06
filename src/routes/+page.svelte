<script lang="ts">
	import { onMount } from 'svelte';
	import { pickRandomLens } from '$lib/camera-data';

	let { data } = $props();

	// 50 reale Full-Frame-Kameramodelle für die Erkennungs-Simulation
	const FULL_FRAME_CAMERAS = [
		'Sony A7 IV', 'Sony A7 III', 'Sony A7R V', 'Sony A7R IV', 'Sony A7R III',
		'Sony A7S III', 'Sony A7S II', 'Sony A7C', 'Sony A1', 'Sony A9 III',
		'Sony A9 II', 'Sony FX3',
		'Canon EOS R5', 'Canon EOS R5 C', 'Canon EOS R6 Mark II', 'Canon EOS R6',
		'Canon EOS R8', 'Canon EOS R', 'Canon EOS RP', 'Canon EOS 1D X Mark III',
		'Canon EOS 5D Mark IV', 'Canon EOS 6D Mark II',
		'Nikon Z9', 'Nikon Z8', 'Nikon Z7 II', 'Nikon Z6 III', 'Nikon Z6 II',
		'Nikon Z5', 'Nikon Zf', 'Nikon D850', 'Nikon D6', 'Nikon D780',
		'Panasonic Lumix S5 II', 'Panasonic Lumix S5 IIX', 'Panasonic Lumix S1H',
		'Panasonic Lumix S1', 'Panasonic Lumix S1R', 'Panasonic Lumix S9',
		'Sigma fp', 'Sigma fp L',
		'Leica SL3', 'Leica SL2', 'Leica SL2-S', 'Leica M11', 'Leica M11-P',
		'Leica Q3', 'Leica Q2',
		'Pentax K-1 Mark II',
		'Hasselblad X2D 100C', 'Hasselblad X1D II 50C'
	];

	function randomSerial(): string {
		return 'SD-' + Math.random().toString(36).slice(2, 10).toUpperCase();
	}

	type DetectedCard = { label: string; serial: string; lens: string };

	function generateDetectedCards(): DetectedCard[] {
		const count = Math.floor(Math.random() * 5) + 1; // 1 bis 5 Karten
		const pool = [...FULL_FRAME_CAMERAS];
		const picked: DetectedCard[] = [];
		for (let i = 0; i < count && pool.length > 0; i++) {
			const idx = Math.floor(Math.random() * pool.length);
			const camera = pool.splice(idx, 1)[0];
			picked.push({ label: camera, serial: randomSerial(), lens: pickRandomLens(camera) });
		}
		return picked;
	}

	let detectedCards = $state<DetectedCard[]>([]);

	function regenerate() {
		detectedCards = generateDetectedCards();
	}

	const importLink = $derived.by(() => {
		if (detectedCards.length === 0) return '/import';
		const params = new URLSearchParams();
		for (const c of detectedCards) {
			params.append('detected', `${c.label}|${c.serial}|${c.lens}`);
		}
		return `/import?${params}`;
	});

	let showCameraToast = $state(false);

	function showDetected() {
		regenerate();
		showCameraToast = true;
	}

	onMount(() => {
		// Direkt beim Mount neue Karten generieren (zufällig pro Seitenaufruf)
		regenerate();
		// Auto-Trigger nur beim ersten Laden pro Session
		if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('sdkim_camera_toast_shown')) {
			const timer = setTimeout(() => {
				showCameraToast = true;
				sessionStorage.setItem('sdkim_camera_toast_shown', '1');
			}, 5_000);
			return () => clearTimeout(timer);
		}
	});

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatSize(bytes: number) {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-700',
		running: 'bg-blue-100 text-blue-700',
		completed: 'bg-green-100 text-green-700',
		error: 'bg-red-100 text-red-700'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Ausstehend',
		running: 'Läuft',
		completed: 'Abgeschlossen',
		error: 'Fehler'
	};
</script>

<div class="space-y-10">
	<!-- Erkennung-Toast -->
	{#if showCameraToast}
		<div class="rounded-2xl px-5 py-4 flex items-start justify-between gap-4 shadow-[var(--shadow-card)]" style="background:var(--color-brand-50); border:1px solid var(--color-brand-100);">
			<div class="flex items-start gap-3.5">
				<div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--color-brand-500); color:#fff;" aria-hidden="true">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
						<path d="M3 7a2 2 0 0 1 2-2h2.5l1.2-1.7A2 2 0 0 1 10.4 2.5h3.2c.6 0 1.2.3 1.6.8L16.5 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<circle cx="12" cy="13" r="3.6"/>
					</svg>
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-[15px] font-semibold" style="color:var(--color-brand-900)">
						{detectedCards.length} {detectedCards.length === 1 ? 'Karte' : 'Karten'} erkannt
					</p>
					<ul class="mt-1 space-y-0.5">
						{#each detectedCards as c}
							<li class="text-[13px]" style="color:var(--color-brand-700)">
								<strong>{c.label}</strong>
								<span style="color:var(--color-brand-500)">· {c.lens}</span>
								<span class="font-mono text-[11.5px]" style="color:var(--color-brand-400)">({c.serial})</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="flex items-center gap-1.5 shrink-0">
				<button type="button" onclick={regenerate} title="Neue Karten simulieren" aria-label="Neu generieren" class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style="color:var(--color-brand-600)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(94,92,230,0.10)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
						<polyline points="23 4 23 10 17 10"/>
						<polyline points="1 20 1 14 7 14"/>
						<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
					</svg>
				</button>
				<a href={importLink} class="text-[13px] font-semibold text-white px-3.5 py-2 rounded-full transition-all" style="background:var(--color-brand-500)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-600)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-500)'}>Alle importieren</a>
				<button onclick={() => (showCameraToast = false)} class="w-8 h-8 flex items-center justify-center rounded-lg text-lg leading-none" style="color:var(--color-brand-600)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(94,92,230,0.10)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''} aria-label="Schliessen">×</button>
			</div>
		</div>
	{/if}

	<div class="flex items-end justify-between">
		<div>
			<h1 class="text-[32px] font-semibold leading-[1.15] tracking-tight" style="color:var(--color-ink-900)">Dashboard</h1>
			<p class="text-[15px] mt-1.5" style="color:var(--color-ink-500)">Übersicht über deine Projekte und Importe.</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={showDetected}
				title="Kamera-Erkennung simulieren"
				aria-label="Kamera-Erkennung simulieren"
				class="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
				style="color:var(--color-ink-500); background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-brand-500)'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
					<path d="M3 7a2 2 0 0 1 2-2h2.5l1.2-1.7A2 2 0 0 1 10.4 2.5h3.2c.6 0 1.2.3 1.6.8L16.5 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
					<circle cx="12" cy="13" r="3.6"/>
				</svg>
			</button>
			<a
				href="/import"
				class="text-[14px] font-semibold text-white px-5 py-2.5 rounded-full transition-all shadow-[var(--shadow-soft)]"
				style="background:var(--color-brand-500)"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-600)'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-500)'}
			>
				Import starten
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: 'Projekte', value: data.stats.projects },
			{ label: 'Importe', value: data.stats.imports },
			{ label: 'Dateien', value: data.stats.files },
			{ label: 'Gesamtgrösse', value: data.stats.totalSizeGb + ' GB' }
		] as stat}
			<div class="rounded-2xl p-6 transition-all" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
				<span class="text-[11px] font-semibold uppercase tracking-[0.06em]" style="color:var(--color-ink-400)">{stat.label}</span>
				<p class="text-[34px] font-semibold mt-2 tracking-tight" style="color:var(--color-ink-900)">{stat.value}</p>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-2 gap-5">
		<!-- Letzte Importe -->
		<div class="rounded-2xl overflow-hidden" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
			<div class="px-6 py-4 flex items-center justify-between" style="border-bottom:1px solid var(--color-stroke)">
				<h2 class="text-[15px] font-semibold" style="color:var(--color-ink-900)">Letzte Importe</h2>
				<a href="/projects" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Alle anzeigen</a>
			</div>
			<div>
				{#if data.recentImports.length === 0}
					<p class="px-6 py-10 text-[13px] text-center" style="color:var(--color-ink-400)">Noch keine Importe vorhanden</p>
				{:else}
					{#each data.recentImports as imp, i}
						<div class="px-6 py-3.5 flex items-center justify-between" style={i > 0 ? 'border-top:1px solid var(--color-stroke);' : ''}>
							<div class="min-w-0">
								<p class="text-[14px] font-medium truncate" style="color:var(--color-ink-900)">{imp.project_name ?? '—'}</p>
								<p class="text-[12.5px] mt-0.5" style="color:var(--color-ink-400)">{imp.sd_card_label ?? '—'} · {formatDate(imp.started_at)}</p>
							</div>
							<div class="flex items-center gap-3 ml-4 shrink-0">
								<span class="text-[12.5px]" style="color:var(--color-ink-500)">{imp.file_count} Dateien</span>
								<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full {statusColors[imp.status] ?? ''}" style={imp.status === 'completed' ? 'background:var(--color-success-soft); color:var(--color-success);' : imp.status === 'error' ? 'background:var(--color-danger-soft); color:var(--color-danger);' : imp.status === 'running' ? 'background:var(--color-info-soft); color:var(--color-info);' : 'background:var(--color-warning-soft); color:var(--color-warning);'}>
									{statusLabels[imp.status] ?? imp.status}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- SD-Karten -->
		<div class="rounded-2xl overflow-hidden" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
			<div class="px-6 py-4 flex items-center justify-between" style="border-bottom:1px solid var(--color-stroke)">
				<h2 class="text-[15px] font-semibold" style="color:var(--color-ink-900)">SD-Karten</h2>
				<a href="/sd-cards" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Alle anzeigen</a>
			</div>
			<div>
				{#if data.recentSdCards.length === 0}
					<p class="px-6 py-10 text-[13px] text-center" style="color:var(--color-ink-400)">Noch keine SD-Karten erfasst</p>
				{:else}
					{#each data.recentSdCards as card, i}
						<div class="px-6 py-3.5 flex items-center justify-between" style={i > 0 ? 'border-top:1px solid var(--color-stroke);' : ''}>
							<div>
								<p class="text-[14px] font-medium" style="color:var(--color-ink-900)">{card.label}</p>
								<p class="text-[12.5px] mt-0.5" style="color:var(--color-ink-400)"><span class="font-mono">{card.serial ?? 'Keine Seriennummer'}</span> · {formatDate(card.created_at)}</p>
							</div>
							<a href="/sd-cards" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Details</a>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Letzte Projekte -->
	<div class="rounded-2xl overflow-hidden" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
		<div class="px-6 py-4 flex items-center justify-between" style="border-bottom:1px solid var(--color-stroke)">
			<h2 class="text-[15px] font-semibold" style="color:var(--color-ink-900)">Letzte Projekte</h2>
			<a href="/projects" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Alle anzeigen</a>
		</div>
		<div>
			{#if data.recentProjects.length === 0}
				<p class="px-6 py-10 text-[13px] text-center" style="color:var(--color-ink-400)">Noch keine Projekte vorhanden</p>
			{:else}
				{#each data.recentProjects as project, i}
					<div class="px-6 py-3.5 flex items-center justify-between" style={i > 0 ? 'border-top:1px solid var(--color-stroke);' : ''}>
						<div class="min-w-0">
							<p class="text-[14px] font-medium" style="color:var(--color-ink-900)">{project.name}</p>
							{#if project.notes}
								<p class="text-[12.5px] mt-0.5 truncate max-w-md" style="color:var(--color-ink-400)">{project.notes}</p>
							{/if}
						</div>
						<div class="flex items-center gap-4 shrink-0 ml-4">
							<span class="text-[12.5px]" style="color:var(--color-ink-400)">{formatDate(project.created_at)}</span>
							<a href="/projects/{project.id}" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Öffnen →</a>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
