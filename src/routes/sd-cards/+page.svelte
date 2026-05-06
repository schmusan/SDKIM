<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showCreate = $state(false);
	let editingId = $state<string | null>(null);
	let expandedId = $state<string | null>(null);

	function formatSize(bytes: number | string | null) {
		if (!bytes) return '—';
		const b = Number(bytes);
		if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
		if (b >= 1048576) return (b / 1048576).toFixed(0) + ' MB';
		return (b / 1024).toFixed(0) + ' KB';
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">SD-Karten</h1>
			<p class="text-sm text-gray-500 mt-1">{data.cards.length} Karte{data.cards.length !== 1 ? 'n' : ''} erfasst</p>
		</div>
		<button
			onclick={() => showCreate = !showCreate}
			class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
		>
			+ Neue SD-Karte
		</button>
	</div>

	<!-- Neue SD-Karte -->
	{#if showCreate}
		<div class="bg-white rounded-lg border border-gray-200 p-5">
			<h2 class="font-semibold text-gray-800 mb-4">Neue SD-Karte erfassen</h2>
			<form method="POST" action="?/create" use:enhance={{ onResult: () => { showCreate = false; } }} class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-sm text-gray-600 mb-1">Label *</label>
					<input name="label" type="text" placeholder="z.B. SonyA7IV_Karte1"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
				</div>
				<div>
					<label class="block text-sm text-gray-600 mb-1">Seriennummer (optional)</label>
					<input name="serial" type="text" placeholder="z.B. SD-20240001"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div class="col-span-2 flex gap-2 justify-end">
					<button type="button" onclick={() => showCreate = false} class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Abbrechen</button>
					<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Speichern</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Kartenliste -->
	{#if data.cards.length === 0}
		<div class="bg-white rounded-lg border border-gray-200 px-5 py-16 text-center">
			<p class="text-gray-400 text-sm">Noch keine SD-Karten erfasst.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.cards as card}
				<div class="bg-white rounded-lg border border-gray-200">
					<!-- Karten-Header -->
					<div class="px-5 py-4 flex items-center justify-between">
						{#if editingId === card.id}
							<form method="POST" action="?/update" use:enhance={{ onResult: () => { editingId = null; } }} class="flex gap-2 flex-1 mr-4">
								<input type="hidden" name="id" value={card.id} />
								<input name="label" value={card.label} placeholder="Label"
									class="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
								<input name="serial" value={card.serial ?? ''} placeholder="Seriennummer"
									class="w-40 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
								<button type="submit" class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700">Speichern</button>
								<button type="button" onclick={() => editingId = null} class="text-sm text-gray-500 hover:text-gray-700 px-2">✕</button>
							</form>
						{:else}
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{card.label}</span>
									{#if card.serial}
										<span class="text-xs text-gray-400 font-mono">{card.serial}</span>
									{/if}
								</div>
								<div class="flex gap-4 mt-1">
									<span class="text-xs text-gray-400">Erfasst: {formatDate(card.created_at)}</span>
									{#if card.stats}
										<span class="text-xs text-gray-400">{card.stats.import_count} Import{Number(card.stats.import_count) !== 1 ? 'e' : ''}</span>
										<span class="text-xs text-gray-400">{card.stats.file_count ?? 0} Dateien</span>
										<span class="text-xs text-gray-400">{formatSize(card.stats.total_size)}</span>
									{:else}
										<span class="text-xs text-gray-400">Noch nicht importiert</span>
									{/if}
								</div>
							</div>
						{/if}

						<div class="flex items-center gap-3 shrink-0">
							{#if card.history.length > 0}
								<button
									onclick={() => expandedId = expandedId === card.id ? null : card.id}
									class="text-xs text-blue-600 hover:underline"
								>
									{expandedId === card.id ? 'Historie ausblenden' : 'Historie anzeigen'}
								</button>
							{/if}
							<button onclick={() => editingId = card.id} class="text-xs text-gray-500 hover:text-gray-700">Bearbeiten</button>
							<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('SD-Karte wirklich löschen?')) e.preventDefault(); }}>
								<input type="hidden" name="id" value={card.id} />
								<button type="submit" class="text-xs text-red-400 hover:text-red-600">Löschen</button>
							</form>
						</div>
					</div>

					<!-- Importhistorie -->
					{#if expandedId === card.id && card.history.length > 0}
						<div class="border-t border-gray-100 divide-y divide-gray-50">
							<div class="px-5 py-2 bg-gray-50">
								<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Importhistorie</p>
							</div>
							{#each card.history as imp}
								<div class="px-5 py-3 flex items-center justify-between">
									<div>
										<a href="/projects/{imp.project_id}" class="text-sm text-blue-600 hover:underline">{imp.project_name ?? '—'}</a>
										<p class="text-xs text-gray-400 mt-0.5">{formatDate(imp.started_at)} · {imp.file_count} Dateien · {formatSize(imp.total_size)}</p>
									</div>
									<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{imp.status}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
