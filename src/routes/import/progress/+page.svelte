<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let progress = $state(0);
	let currentFile = $state('Initialisierung...');
	let phase = $state<'scanning' | 'copying' | 'verifying' | 'done'>('scanning');
	let copiedFiles = $state(0);

	const totalFiles = data.importList.reduce((s, i) => s + (i.file_count ?? 0), 0);
	const confirmUrl = `/import/confirm?ids=${data.importIds.join(',')}`;

	function formatSize(bytes: number) {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	const totalSize = data.importList.reduce((s, i) => s + (i.total_size ?? 0), 0);

	const phaseLabels = {
		scanning: 'SD-Karte wird gescannt…',
		copying: 'Dateien werden kopiert…',
		verifying: 'Prüfsummen werden verifiziert…',
		done: 'Import abgeschlossen'
	};

	onMount(() => {
		const DURATION = 3000;
		const FPS = 30;
		const totalSteps = (DURATION / 1000) * FPS;
		let step = 0;

		const timer = setInterval(() => {
			step++;
			const ratio = step / totalSteps;
			progress = Math.min(100, Math.round(ratio * 100));
			copiedFiles = Math.min(totalFiles, Math.round(ratio * totalFiles));

			if (ratio < 0.15) {
				phase = 'scanning';
				currentFile = 'Dateisystem lesen…';
			} else if (ratio < 0.85) {
				phase = 'copying';
				const fileIdx = Math.floor(
					((ratio - 0.15) / 0.7) * (data.sampleFiles.length - 1)
				);
				currentFile = data.sampleFiles[fileIdx] ?? '…';
			} else {
				phase = 'verifying';
				currentFile = 'SHA-256 Prüfsummen verifizieren…';
			}

			if (step >= totalSteps) {
				clearInterval(timer);
				phase = 'done';
				currentFile = 'Fertig';
				progress = 100;
				copiedFiles = totalFiles;
				setTimeout(() => goto(confirmUrl), 600);
			}
		}, 1000 / FPS);

		return () => clearInterval(timer);
	});
</script>

<div class="max-w-2xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Import läuft</h1>
		<p class="text-sm text-gray-500 mt-1">
			{data.importList[0]?.project_name ?? 'Projekt'} ·
			{data.importList.length} SD-Karte{data.importList.length > 1 ? 'n' : ''}
		</p>
	</div>

	<!-- Progress Card -->
	<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
		<!-- Phase + Status -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if phase !== 'done'}
					<div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
				{:else}
					<div class="w-2 h-2 rounded-full bg-green-500"></div>
				{/if}
				<span class="text-sm font-medium text-gray-700">{phaseLabels[phase]}</span>
			</div>
			<span class="text-sm font-semibold text-gray-900">{progress}%</span>
		</div>

		<!-- Progress Bar -->
		<div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
			<div
				class="h-3 rounded-full transition-all duration-100 ease-linear {phase === 'done'
					? 'bg-green-500'
					: 'bg-blue-500'}"
				style="width: {progress}%"
			></div>
		</div>

		<!-- Datei-Counter -->
		<div class="flex items-center justify-between text-xs text-gray-400">
			<span class="font-mono truncate max-w-sm">{currentFile}</span>
			<span class="shrink-0 ml-4">{copiedFiles} / {totalFiles} Dateien</span>
		</div>
	</div>

	<!-- SD-Karten -->
	<div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-50">
		{#each data.importList as imp}
			<div class="px-5 py-3 flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-800">{imp.sd_card_label ?? '—'}</p>
					<p class="text-xs text-gray-400">{imp.file_count} Dateien · {formatSize(imp.total_size ?? 0)}</p>
				</div>
				{#if phase === 'done'}
					<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Bereit</span>
				{:else}
					<span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Läuft</span>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Gesamtgrösse -->
	<div class="flex justify-center">
		<p class="text-xs text-gray-400">
			Gesamt: {formatSize(totalSize)} · Bitte warte bis der Import abgeschlossen ist
		</p>
	</div>
</div>
