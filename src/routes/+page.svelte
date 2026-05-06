<script lang="ts">
	let { data } = $props();

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
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
			<p class="text-sm text-gray-500 mt-1">Übersicht über Projekte und Importe</p>
		</div>
		<a
			href="/import"
			class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
		>
			+ Import starten
		</a>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: 'Projekte', value: data.stats.projects, icon: '▤' },
			{ label: 'Importe', value: data.stats.imports, icon: '↓' },
			{ label: 'Dateien', value: data.stats.files, icon: '◻' },
			{ label: 'Gesamt', value: data.stats.totalSizeGb + ' GB', icon: '⊠' }
		] as stat}
			<div class="bg-white rounded-lg border border-gray-200 p-5">
				<div class="flex items-center justify-between">
					<span class="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</span>
					<span class="text-gray-300 text-xl">{stat.icon}</span>
				</div>
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
