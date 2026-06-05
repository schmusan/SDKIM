<script lang="ts">
	let { data } = $props();

	const totalFiles = data.importList.reduce((s, i) => s + (i.file_count ?? 0), 0);
	const totalSize = data.importList.reduce((s, i) => s + (i.total_size ?? 0), 0);
	const totalDuplicates = data.importList.reduce((s, i) => s + (i.duplicate_count ?? 0), 0);
	const totalErrors = data.importList.reduce((s, i) => s + (i.error_count ?? 0), 0);
	const projectId = data.importList[0]?.project_id;

	function formatSize(bytes: number) {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	function formatTime(started: string, completed: string | null) {
		if (!completed) return '—';
		const ms = new Date(completed).getTime() - new Date(started).getTime();
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
	}

	const byCamera = data.importedFiles.reduce<Record<string, number>>((acc, f) => {
		const cam = f.exif_camera_model ?? 'Unbekannt';
		acc[cam] = (acc[cam] ?? 0) + 1;
		return acc;
	}, {});

	const logColors: Record<string, string> = {
		info: 'text-blue-600',
		warning: 'text-yellow-600',
		error: 'text-red-600'
	};
</script>

<div class="max-w-3xl space-y-6">
	<!-- Header -->
	<div class="flex items-start gap-4">
		<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl shrink-0">✓</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Import abgeschlossen</h1>
			<p class="text-sm text-gray-500 mt-1">
				{data.importList.length} SD-Karte{data.importList.length > 1 ? 'n' : ''} für
				<strong>{data.importList[0]?.project_name}</strong> importiert
			</p>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: 'Dateien importiert', value: totalFiles, color: 'text-gray-900' },
			{ label: 'Gesamtgrösse', value: formatSize(totalSize), color: 'text-gray-900' },
			{ label: 'Duplikate übersprungen', value: totalDuplicates, color: totalDuplicates > 0 ? 'text-yellow-600' : 'text-gray-900' },
			{ label: 'Fehler', value: totalErrors, color: totalErrors > 0 ? 'text-red-600' : 'text-gray-900' }
		] as stat}
			<div class="bg-white rounded-lg border border-gray-200 p-4 text-center">
				<p class="text-xs text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
				<p class="text-2xl font-bold {stat.color}">{stat.value}</p>
			</div>
		{/each}
	</div>

	<!-- Pro SD-Karte -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="px-5 py-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-800">Import-Details</h2>
		</div>
		<div class="divide-y divide-gray-50">
			{#each data.importList as imp}
				<div class="px-5 py-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-800">{imp.sd_card_label}</p>
							<p class="text-xs text-gray-400 mt-0.5">
								{imp.file_count} Dateien · {formatSize(imp.total_size ?? 0)} · Dauer: {formatTime(imp.started_at, imp.completed_at)}
							</p>
						</div>
						<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Abgeschlossen</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Nach Kamera -->
	{#if Object.keys(byCamera).length > 0}
		<div class="bg-white rounded-lg border border-gray-200 p-5">
			<h2 class="font-semibold text-gray-800 mb-4">Dateien nach Kamera</h2>
			<div class="space-y-2">
				{#each Object.entries(byCamera) as [cam, count]}
					<div class="flex items-center gap-3">
						<span class="text-sm text-gray-600 w-36 shrink-0">{cam}</span>
						<div class="flex-1 bg-gray-100 rounded-full h-2">
							<div
								class="bg-blue-500 h-2 rounded-full"
								style="width: {(count / totalFiles * 100).toFixed(0)}%"
							></div>
						</div>
						<span class="text-xs text-gray-400 w-16 text-right">{count} Dateien</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Import-Log -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="px-5 py-4 border-b border-gray-100">
			<h2 class="font-semibold text-gray-800">Import-Log</h2>
		</div>
		<div class="px-5 py-3 space-y-1.5 font-mono text-xs">
			{#each data.logs as log}
				<div class="flex items-start gap-2">
					<span class="text-gray-300 shrink-0">{new Date(log.created_at).toLocaleTimeString('de-CH')}</span>
					<span class="{logColors[log.type] ?? 'text-gray-600'}">[{log.type.toUpperCase()}]</span>
					<span class="text-gray-700">{log.message}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Aktionen -->
	<div class="flex gap-3 justify-end">
		<a
			href="/import"
			class="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-md transition-colors"
		>
			Weiteren Import starten
		</a>
		{#if projectId}
			<a
				href="/projects/{projectId}?imported=1"
				class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
			>
				Zum Projekt →
			</a>
		{/if}
	</div>
</div>
