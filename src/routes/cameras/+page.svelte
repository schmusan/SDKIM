<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreate = $state(false);
	let editingId = $state<string | null>(null);
	let newModel = $state('');
	let newPattern = $state('');

	const presets = [
		{ model: 'Sony A7 IV', pattern: 'SonyA7IV_{lens}' },
		{ model: 'Sony A7 III', pattern: 'SonyA7III_{lens}' },
		{ model: 'Canon EOS R5', pattern: 'CanonR5_{lens}' },
		{ model: 'Nikon Z6 II', pattern: 'NikonZ6II_{lens}' }
	];

	function previewFolder(pattern: string) {
		return pattern.replace('{lens}', '24-70mm').replace('{date}', '2026-05-06').replace('{model}', 'A7IV');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Kamera-Profile</h1>
			<p class="text-sm text-gray-500 mt-1">Ordnerbenennungsregeln pro Kameramodell</p>
		</div>
		<button
			onclick={() => showCreate = !showCreate}
			class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
		>
			+ Neues Profil
		</button>
	</div>

	<!-- Platzhalter-Hilfe -->
	<div class="bg-blue-50 border border-blue-100 rounded-lg px-5 py-3">
		<p class="text-xs font-medium text-blue-700 mb-1">Verfügbare Platzhalter im Ordnermuster</p>
		<div class="flex gap-4">
			{#each [
				['{lens}', 'Objektiv (z.B. 24-70mm)'],
				['{date}', 'Aufnahmedatum (z.B. 2026-05-06)'],
				['{model}', 'Kurzname des Modells']
			] as [ph, desc]}
				<span class="text-xs text-blue-600"><code class="bg-blue-100 px-1 rounded">{ph}</code> {desc}</span>
			{/each}
		</div>
	</div>

	<!-- Neues Profil -->
	{#if showCreate}
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<h2 class="font-semibold text-gray-800">Neues Kamera-Profil</h2>

			<!-- Presets -->
			<div>
				<p class="text-xs text-gray-500 mb-2">Schnellauswahl:</p>
				<div class="flex flex-wrap gap-2">
					{#each presets as preset}
						<button
							type="button"
							onclick={() => { newModel = preset.model; newPattern = preset.pattern; }}
							class="text-xs border border-gray-300 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-md transition-colors"
						>
							{preset.model}
						</button>
					{/each}
				</div>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							showCreate = false;
							newModel = '';
							newPattern = '';
						}
					};
				}}
				class="space-y-3"
			>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sm text-gray-600 mb-1">Kameramodell *</label>
						<input name="model" type="text" bind:value={newModel} placeholder="z.B. Sony A7 IV"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
					</div>
					<div>
						<label class="block text-sm text-gray-600 mb-1">Ordnermuster *</label>
						<input name="folder_pattern" type="text" bind:value={newPattern} placeholder="z.B. SonyA7IV_{lens}"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
					</div>
				</div>
				{#if newPattern}
					<div class="bg-gray-900 rounded-md px-4 py-2.5">
						<span class="text-xs text-gray-400">Vorschau: </span>
						<span class="text-xs text-green-400 font-mono">{previewFolder(newPattern)}/</span>
					</div>
				{/if}
				<div class="flex gap-2 justify-end">
					<button type="button" onclick={() => showCreate = false} class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Abbrechen</button>
					<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Speichern</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Profilliste -->
	{#if data.cameras.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 px-5 py-16 text-center">
			<p class="text-gray-400 text-sm">Noch keine Kamera-Profile hinterlegt.</p>
			<p class="text-gray-300 text-xs mt-1">Profile werden beim Import zur Ordnerbenennung verwendet.</p>
		</div>
	{:else}
		<div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
			{#each data.cameras as cam}
				<div class="px-5 py-4">
					{#if editingId === cam.id}
						<form
							method="POST"
							action="?/update"
							use:enhance={() => {
								return async ({ result, update }) => {
									await update();
									if (result.type === 'success') editingId = null;
								};
							}}
							class="space-y-3"
						>
							<input type="hidden" name="id" value={cam.id} />
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="block text-xs text-gray-500 mb-1">Kameramodell</label>
									<input name="model" value={cam.model}
										class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
								</div>
								<div>
									<label class="block text-xs text-gray-500 mb-1">Ordnermuster</label>
									<input name="folder_pattern" value={cam.folder_pattern}
										class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
								</div>
							</div>
							<div class="flex gap-2 justify-end">
								<button type="button" onclick={() => editingId = null} class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Abbrechen</button>
								<button type="submit" class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700">Speichern</button>
							</div>
						</form>
					{:else}
						<div class="flex items-center justify-between">
							<div>
								<div class="flex items-center gap-3">
									<span class="text-sm font-medium text-gray-900">{cam.model}</span>
									{#if cam.file_count > 0}
										<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cam.file_count} Dateien</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 mt-1.5">
									<span class="text-xs text-gray-400">Muster:</span>
									<code class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{cam.folder_pattern}</code>
									<span class="text-gray-300 text-xs">→</span>
									<code class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{previewFolder(cam.folder_pattern)}/</code>
								</div>
							</div>
							<div class="flex gap-3">
								<button onclick={() => editingId = cam.id} class="text-xs text-gray-500 hover:text-gray-700">Bearbeiten</button>
								<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('Profil löschen?')) e.preventDefault(); }}>
									<input type="hidden" name="id" value={cam.id} />
									<button type="submit" class="text-xs text-red-400 hover:text-red-600">Löschen</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
