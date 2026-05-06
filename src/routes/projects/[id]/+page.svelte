<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let editing = $state(false);
	let editName = $state(data.project.name);
	let editNotes = $state(data.project.notes ?? '');
	let selectedFile = $state<typeof data.projectFiles[0] | null>(null);
	let activeTab = $state<'files' | 'imports' | 'logs'>('files');

	const totalSize = data.projectImports.reduce((s, i) => s + (i.total_size ?? 0), 0);
	const totalFiles = data.projectImports.reduce((s, i) => s + (i.file_count ?? 0), 0);

	function formatSize(bytes: number | null) {
		if (!bytes) return '—';
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	const byCamera = data.projectFiles.reduce<Record<string, number>>((acc, f) => {
		const cam = f.exif_camera_model ?? 'Unbekannt';
		acc[cam] = (acc[cam] ?? 0) + 1;
		return acc;
	}, {});

	const byExt = data.projectFiles.reduce<Record<string, number>>((acc, f) => {
		const ext = f.filename.split('.').pop()?.toUpperCase() ?? '?';
		acc[ext] = (acc[ext] ?? 0) + 1;
		return acc;
	}, {});

	const logColors: Record<string, string> = {
		info: 'text-blue-600',
		warning: 'text-yellow-600',
		error: 'text-red-600'
	};
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="min-w-0">
			<div class="flex items-center gap-2 text-xs text-gray-400 mb-1">
				<a href="/projects" class="hover:text-blue-600">Projekte</a>
				<span>/</span>
				<span class="text-gray-600">{data.project.name}</span>
			</div>
			{#if editing}
				<form method="POST" action="?/update" use:enhance onsubmit={() => editing = false} class="space-y-2">
					<input name="name" bind:value={editName} class="text-xl font-bold border border-blue-400 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
					<textarea name="notes" bind:value={editNotes} placeholder="Notizen..." rows="2" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
					<div class="flex gap-2">
						<button type="submit" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700">Speichern</button>
						<button type="button" onclick={() => editing = false} class="text-xs text-gray-500 hover:text-gray-700 px-2">Abbrechen</button>
					</div>
				</form>
			{:else}
				<h1 class="text-2xl font-bold text-gray-900">{data.project.name}</h1>
				{#if data.project.notes}
					<p class="text-sm text-gray-500 mt-1">{data.project.notes}</p>
				{/if}
			{/if}
		</div>
		{#if !editing}
			<div class="flex gap-2 shrink-0 ml-4">
				<button onclick={() => editing = true} class="border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-3 py-2 rounded-md transition-colors">Bearbeiten</button>
				<a href="/import" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">+ Import starten</a>
			</div>
		{/if}
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: 'Importe', value: data.projectImports.length },
			{ label: 'Dateien', value: totalFiles },
			{ label: 'Gesamt', value: formatSize(totalSize) },
			{ label: 'Duplikate', value: data.projectImports.reduce((s, i) => s + (i.duplicate_count ?? 0), 0) }
		] as stat}
			<div class="bg-white rounded-lg border border-gray-200 p-4 text-center">
				<p class="text-xs text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
				<p class="text-2xl font-bold text-gray-900">{stat.value}</p>
			</div>
		{/each}
	</div>

	<!-- Kamera & Dateiformat -->
	{#if data.projectFiles.length > 0}
		<div class="grid grid-cols-2 gap-4">
			<div class="bg-white rounded-lg border border-gray-200 p-5">
				<h3 class="text-sm font-semibold text-gray-700 mb-3">Nach Kamera</h3>
				<div class="space-y-2">
					{#each Object.entries(byCamera) as [cam, count]}
						<div class="flex items-center gap-3">
							<span class="text-xs text-gray-600 w-28 shrink-0 truncate">{cam}</span>
							<div class="flex-1 bg-gray-100 rounded-full h-1.5">
								<div class="bg-blue-500 h-1.5 rounded-full" style="width: {(count / totalFiles * 100).toFixed(0)}%"></div>
							</div>
							<span class="text-xs text-gray-400 w-12 text-right">{count}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="bg-white rounded-lg border border-gray-200 p-5">
				<h3 class="text-sm font-semibold text-gray-700 mb-3">Nach Dateiformat</h3>
				<div class="space-y-2">
					{#each Object.entries(byExt) as [ext, count]}
						<div class="flex items-center gap-3">
							<span class="text-xs text-gray-600 w-28 shrink-0">{ext}</span>
							<div class="flex-1 bg-gray-100 rounded-full h-1.5">
								<div class="bg-purple-500 h-1.5 rounded-full" style="width: {(count / totalFiles * 100).toFixed(0)}%"></div>
							</div>
							<span class="text-xs text-gray-400 w-12 text-right">{count}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="flex border-b border-gray-200 px-1">
			{#each [
				{ key: 'files', label: `Dateien (${data.projectFiles.length})` },
				{ key: 'imports', label: `Importe (${data.projectImports.length})` },
				{ key: 'logs', label: `Log (${data.logs.length})` }
			] as tab}
				<button
					onclick={() => activeTab = tab.key as typeof activeTab}
					class="px-4 py-3 text-sm font-medium border-b-2 transition-colors
						{activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Dateien -->
		{#if activeTab === 'files'}
			{#if data.projectFiles.length === 0}
				<p class="px-5 py-10 text-sm text-gray-400 text-center">Noch keine Dateien importiert.</p>
			{:else}
				<div class="divide-y divide-gray-50">
					{#each data.projectFiles.slice(0, 50) as file}
						<button
							onclick={() => selectedFile = selectedFile?.id === file.id ? null : file}
							class="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3 min-w-0">
									<span class="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
										{file.filename.split('.').pop()?.toUpperCase()}
									</span>
									<span class="text-sm text-gray-800 truncate">{file.filename}</span>
									{#if file.is_duplicate}
										<span class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">Duplikat</span>
									{/if}
								</div>
								<span class="text-xs text-gray-400 ml-4 shrink-0">{formatSize(file.size)}</span>
							</div>

							<!-- EXIF Detailansicht -->
							{#if selectedFile?.id === file.id}
								<div class="mt-3 grid grid-cols-4 gap-2 text-xs bg-gray-50 rounded-md p-3">
									<div><span class="text-gray-400 block">Kamera</span><span class="font-medium">{file.exif_camera_model ?? '—'}</span></div>
									<div><span class="text-gray-400 block">ISO</span><span class="font-medium">{file.exif_iso ?? '—'}</span></div>
									<div><span class="text-gray-400 block">Verschlusszeit</span><span class="font-medium">{file.exif_shutter ?? '—'}</span></div>
									<div><span class="text-gray-400 block">Brennweite</span><span class="font-medium">{file.exif_focal_length ?? '—'}</span></div>
									<div class="col-span-2"><span class="text-gray-400 block">Pfad</span><span class="font-mono text-gray-600 break-all">{file.path}</span></div>
									{#if file.checksum}
										<div class="col-span-2"><span class="text-gray-400 block">Prüfsumme</span><span class="font-mono text-green-600 truncate block">✓ {file.checksum}</span></div>
									{/if}
								</div>
							{/if}
						</button>
					{/each}
					{#if data.projectFiles.length > 50}
						<p class="px-5 py-3 text-xs text-gray-400 text-center">… und {data.projectFiles.length - 50} weitere Dateien</p>
					{/if}
				</div>
			{/if}
		{/if}

		<!-- Importe -->
		{#if activeTab === 'imports'}
			{#if data.projectImports.length === 0}
				<p class="px-5 py-10 text-sm text-gray-400 text-center">Noch keine Importe für dieses Projekt.</p>
			{:else}
				<div class="divide-y divide-gray-50">
					{#each data.projectImports as imp}
						<div class="px-5 py-4 flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-800">{imp.sd_card_label ?? '—'}</p>
								<p class="text-xs text-gray-400 mt-0.5">{formatDate(imp.started_at)} · {imp.file_count} Dateien · {formatSize(imp.total_size)}</p>
								{#if imp.duplicate_count}
									<p class="text-xs text-yellow-600 mt-0.5">{imp.duplicate_count} Duplikat(e) übersprungen</p>
								{/if}
							</div>
							<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{imp.status}</span>
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Log -->
		{#if activeTab === 'logs'}
			{#if data.logs.length === 0}
				<p class="px-5 py-10 text-sm text-gray-400 text-center">Keine Log-Einträge.</p>
			{:else}
				<div class="px-5 py-4 space-y-1.5 font-mono text-xs">
					{#each data.logs as log}
						<div class="flex items-start gap-2">
							<span class="text-gray-300 shrink-0">{new Date(log.created_at).toLocaleTimeString('de-CH')}</span>
							<span class="{logColors[log.type] ?? 'text-gray-600'}">[{log.type.toUpperCase()}]</span>
							<span class="text-gray-700">{log.message}</span>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
