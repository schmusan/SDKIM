<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	// "Kamera erkannt"-Simulation: erste Karte des Nutzers nehmen (falls vorhanden),
	// sonst Demo-Label
	let detectedCard = $derived(data.recentSdCards?.[0]?.label ?? 'Sony A7 IV (SD-20240001)');

	let showCameraToast = $state(false);
	let firstAutoTriggered = false;

	function showDetected() {
		showCameraToast = true;
	}

	onMount(() => {
		// Auto-Trigger nur beim ersten Laden pro Session
		if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('sdkim_camera_toast_shown')) {
			const timer = setTimeout(() => {
				showCameraToast = true;
				sessionStorage.setItem('sdkim_camera_toast_shown', '1');
				firstAutoTriggered = true;
			}, 15_000);
			return () => clearTimeout(timer);
		}
	});

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
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

<div class="space-y-8">
	<!-- "Kamera erkannt"-Toast -->
	{#if showCameraToast}
		<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start justify-between gap-4 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg shrink-0" aria-hidden="true">
					<!-- Kamera-SVG -->
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
						<path d="M3 7a2 2 0 0 1 2-2h2.5l1.2-1.7A2 2 0 0 1 10.4 2.5h3.2c.6 0 1.2.3 1.6.8L16.5 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<circle cx="12" cy="13" r="3.6"/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-blue-900">Kamera / SD-Karte erkannt</p>
					<p class="text-xs text-blue-700 mt-0.5"><strong>{detectedCard}</strong> ist bereit zum Import.</p>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<a href="/import" class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors">Import starten →</a>
				<button onclick={() => (showCameraToast = false)} class="text-blue-600 hover:text-blue-800 text-xl leading-none px-1">×</button>
			</div>
		</div>
	{/if}

	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
			<p class="text-sm text-gray-500 mt-1">Übersicht über Projekte und Importe</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={showDetected}
				title="Kamera-/SD-Karten-Erkennung simulieren"
				aria-label="Kamera-Erkennung simulieren"
				class="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5">
					<path d="M3 7a2 2 0 0 1 2-2h2.5l1.2-1.7A2 2 0 0 1 10.4 2.5h3.2c.6 0 1.2.3 1.6.8L16.5 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
					<circle cx="12" cy="13" r="3.6"/>
				</svg>
			</button>
			<a
				href="/import"
				class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
			>
				+ Import starten
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
			<div class="bg-white rounded-lg border border-gray-200 p-5">
				<span class="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</span>
				<p class="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-2 gap-6">
		<!-- Letzte Importe -->
		<div class="bg-white rounded-lg border border-gray-200">
			<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
				<h2 class="font-semibold text-gray-800">Letzte Importe</h2>
				<a href="/projects" class="text-xs text-blue-600 hover:underline">Alle anzeigen</a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if data.recentImports.length === 0}
					<p class="px-5 py-8 text-sm text-gray-400 text-center">Noch keine Importe vorhanden</p>
				{:else}
					{#each data.recentImports as imp}
						<div class="px-5 py-3 flex items-center justify-between">
							<div class="min-w-0">
								<p class="text-sm font-medium text-gray-800 truncate">{imp.project_name ?? '—'}</p>
								<p class="text-xs text-gray-400">{imp.sd_card_label ?? '—'} · {formatDate(imp.started_at)}</p>
							</div>
							<div class="flex items-center gap-3 ml-4 shrink-0">
								<span class="text-xs text-gray-500">{imp.file_count} Dateien</span>
								<span class="text-xs px-2 py-0.5 rounded-full font-medium {statusColors[imp.status] ?? 'bg-gray-100 text-gray-600'}">
									{statusLabels[imp.status] ?? imp.status}
								</span>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- SD-Karten -->
		<div class="bg-white rounded-lg border border-gray-200">
			<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
				<h2 class="font-semibold text-gray-800">SD-Karten</h2>
				<a href="/sd-cards" class="text-xs text-blue-600 hover:underline">Alle anzeigen</a>
			</div>
			<div class="divide-y divide-gray-50">
				{#if data.recentSdCards.length === 0}
					<p class="px-5 py-8 text-sm text-gray-400 text-center">Noch keine SD-Karten erfasst</p>
				{:else}
					{#each data.recentSdCards as card}
						<div class="px-5 py-3 flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-800">{card.label}</p>
								<p class="text-xs text-gray-400">{card.serial ?? 'Keine Seriennummer'} · {formatDate(card.created_at)}</p>
							</div>
							<a href="/sd-cards" class="text-xs text-blue-600 hover:underline">Details</a>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Letzte Projekte -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
			<h2 class="font-semibold text-gray-800">Letzte Projekte</h2>
			<a href="/projects" class="text-xs text-blue-600 hover:underline">Alle anzeigen</a>
		</div>
		<div class="divide-y divide-gray-50">
			{#if data.recentProjects.length === 0}
				<p class="px-5 py-8 text-sm text-gray-400 text-center">Noch keine Projekte vorhanden</p>
			{:else}
				{#each data.recentProjects as project}
					<div class="px-5 py-3 flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-800">{project.name}</p>
							{#if project.notes}
								<p class="text-xs text-gray-400 truncate max-w-md">{project.notes}</p>
							{/if}
						</div>
						<div class="flex items-center gap-4">
							<span class="text-xs text-gray-400">{formatDate(project.created_at)}</span>
							<a href="/projects/{project.id}" class="text-xs text-blue-600 hover:underline">Öffnen</a>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
