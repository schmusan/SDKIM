<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreate = $state(false);
	let editingId = $state<string | null>(null);
	let expandedId = $state<string | null>(null);
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

	function formatSize(bytes: number) {
		if (!bytes) return '—';
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Kameras</h1>
			<p class="text-sm text-gray-500 mt-1">Pro Kamera siehst du alle bisherigen Importe und genutzten Objektive.</p>
		</div>
		<button
			onclick={() => showCreate = !showCreate}
			class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
		>+ Neue Kamera</button>
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

	<!-- Neue Kamera anlegen -->
	{#if showCreate}
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<h2 class="font-semibold text-gray-800">Neue Kamera</h2>
			<div>
				<p class="text-xs text-gray-500 mb-2">Schnellauswahl:</p>
				<div class="flex flex-wrap gap-2">
					{#each presets as preset}
						<button
							type="button"
							onclick={() => { newModel = preset.model; newPattern = preset.pattern; }}
							class="text-xs border border-gray-300 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-md transition-colors"
						>{preset.model}</button>
					{/each}
				</div>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						showCreate = false;
						newModel = '';
						newPattern = '';
					}
				}}
				class="space-y-3"
			>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sm text-gray-600 mb-1" for="create_model">Kameramodell *</label>
						<input id="create_model" name="model" type="text" bind:value={newModel} placeholder="z.B. Sony A7 IV"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
					</div>
					<div>
						<label class="block text-sm text-gray-600 mb-1" for="create_pattern">Ordnermuster *</label>
						<input id="create_pattern" name="folder_pattern" type="text" bind:value={newPattern} placeholder={'z.B. SonyA7IV_{lens}'}
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

	<!-- Kameraliste -->
	{#if data.cameras.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 px-5 py-16 text-center">
			<p class="text-gray-400 text-sm">Noch keine Kameras hinterlegt.</p>
			<p class="text-gray-300 text-xs mt-1">Werden beim ersten Import automatisch angelegt.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.cameras as cam}
				{@const isOpen = expandedId === cam.id}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
					{#if editingId === cam.id}
						<form
							method="POST"
							action="?/update"
							use:enhance={() => async ({ result, update }) => {
								await update();
								if (result.type === 'success') editingId = null;
							}}
							class="p-5 space-y-3"
						>
							<input type="hidden" name="id" value={cam.id} />
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="block text-xs text-gray-500 mb-1" for="edit_model_{cam.id}">Kameramodell</label>
									<input id="edit_model_{cam.id}" name="model" value={cam.model}
										class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
								</div>
								<div>
									<label class="block text-xs text-gray-500 mb-1" for="edit_pattern_{cam.id}">Ordnermuster</label>
									<input id="edit_pattern_{cam.id}" name="folder_pattern" value={cam.folder_pattern}
										class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
								</div>
							</div>
							<div class="flex gap-2 justify-end">
								<button type="button" onclick={() => editingId = null} class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Abbrechen</button>
								<button type="submit" class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700">Speichern</button>
							</div>
						</form>
					{:else}
						<!-- Kamera-Kopfzeile -->
						<div class="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
							<button
								type="button"
								onclick={() => expandedId = isOpen ? null : cam.id}
								class="text-left min-w-0 flex-1"
							>
								<div class="flex items-center gap-2">
									<span class="text-base font-semibold text-gray-900">{cam.model}</span>
									<span class="text-xs text-gray-400">{isOpen ? '▴' : '▾'}</span>
								</div>
								<div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
									<span>{cam.totals.imports} Import{cam.totals.imports !== 1 ? 'e' : ''}</span>
									<span>·</span>
									<span>{cam.totals.files} Dateien</span>
									<span>·</span>
									<span>{formatSize(cam.totals.size)}</span>
								</div>
								{#if cam.lenses.length > 0}
									<div class="mt-2 flex flex-wrap gap-1.5">
										{#each cam.lenses as lens}
											<span class="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{lens}</span>
										{/each}
									</div>
								{/if}
								<div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
									<span>Muster:</span>
									<code class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{cam.folder_pattern}</code>
								</div>
							</button>
							<div class="flex gap-3 shrink-0 mt-1">
								<button
									type="button"
									onclick={() => editingId = cam.id}
									class="text-xs text-gray-500 hover:text-gray-700"
								>Bearbeiten</button>
								<form
									method="POST"
									action="?/delete"
									use:enhance
									onsubmit={(e) => { if (!confirm('Profil löschen?')) e.preventDefault(); }}
								>
									<input type="hidden" name="id" value={cam.id} />
									<button type="submit" class="text-xs text-red-400 hover:text-red-600">Löschen</button>
								</form>
							</div>
						</div>

						<!-- Imports-Liste (ausgeklappt) -->
						{#if isOpen}
							<div class="border-t border-gray-100 bg-gray-50">
								{#if cam.imports.length === 0}
									<p class="px-5 py-6 text-sm text-gray-400 text-center">Noch keine Importe mit dieser Kamera.</p>
								{:else}
									<div class="divide-y divide-gray-100">
										{#each cam.imports as imp}
											<div class="px-5 py-3">
												<div class="flex items-center justify-between">
													<div class="min-w-0">
														<p class="text-sm font-medium text-gray-800 truncate">
															{imp.project_name ?? '— ohne Projekt —'}
														</p>
														<p class="text-xs text-gray-500 mt-0.5">
															SD-Karte: <span class="font-mono">{imp.sd_card_label ?? '—'}</span> · {formatDate(imp.started_at)}
														</p>
													</div>
													<div class="flex items-center gap-4 shrink-0 ml-4">
														<span class="text-xs text-gray-600">{imp.file_count} Dateien</span>
														<span class="text-xs text-gray-600">{formatSize(imp.total_size)}</span>
													</div>
												</div>

												<!-- Datei-Sub-Liste -->
												{#if imp.files && imp.files.length > 0}
													<ul class="mt-3 pl-4 border-l-2 border-gray-200 space-y-1">
														{#each imp.files as f}
															<li class="flex items-center justify-between gap-3 text-[12.5px]" style="color:var(--color-ink-600)">
																<span class="flex items-center gap-2 min-w-0">
																	<span class="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style="background:var(--color-ink-50); color:var(--color-ink-500)">
																		{f.filename.split('.').pop()?.toUpperCase() ?? '?'}
																	</span>
																	<span class="font-mono truncate">{f.filename}</span>
																</span>
																<span class="text-[11px] shrink-0" style="color:var(--color-ink-400)">{formatSize(f.size)}</span>
															</li>
														{/each}
													</ul>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
