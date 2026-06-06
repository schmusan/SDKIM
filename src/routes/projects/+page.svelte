<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let showCreateForm = $state(false);
	let newName = $state('');
	let newNotes = $state('');
	let deleteId = $state<string | null>(null);

	// Live-Suche und Live-Filter: URL via goto() aktualisieren, Fokus + Scroll bleiben erhalten
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	function navigateWithForm(form: HTMLFormElement) {
		const formData = new FormData(form);
		const params = new URLSearchParams();
		for (const [key, val] of formData.entries()) {
			if (typeof val === 'string' && val.length > 0) params.set(key, val);
		}
		const url = params.toString() ? `${$page.url.pathname}?${params}` : $page.url.pathname;
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function debouncedSubmit(e: Event) {
		const form = (e.target as HTMLElement).closest('form');
		if (!form) return;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => navigateWithForm(form), 400);
	}
	function instantSubmit(e: Event) {
		const form = (e.target as HTMLElement).closest('form');
		if (form) navigateWithForm(form);
	}

	function formatSize(bytes: number | string | null) {
		if (!bytes) return '—';
		const b = Number(bytes);
		if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
		if (b >= 1048576) return (b / 1048576).toFixed(0) + ' MB';
		return (b / 1024).toFixed(0) + ' KB';
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

<div class="space-y-8">
	<div class="flex items-end justify-between">
		<div>
			<h1 class="text-[32px] font-semibold leading-[1.15] tracking-tight" style="color:var(--color-ink-900)">Projekte</h1>
			<p class="text-[15px] mt-1.5" style="color:var(--color-ink-500)">{data.projects.length} Projekt{data.projects.length !== 1 ? 'e' : ''} insgesamt.</p>
		</div>
		<button
			onclick={() => showCreateForm = !showCreateForm}
			class="rounded-full text-[14px] font-semibold px-5 py-2.5 text-white transition-all shadow-[var(--shadow-soft)]"
			style="background:var(--color-brand-500)"
			onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-600)'}
			onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-500)'}
		>
			Neues Projekt
		</button>
	</div>

	<!-- Neues Projekt -->
	{#if showCreateForm}
		<div class="bg-white rounded-lg border border-gray-200 p-5">
			<h2 class="font-semibold text-gray-800 mb-4">Neues Projekt erstellen</h2>
			<form method="POST" action="?/create" use:enhance class="space-y-3">
				<div>
					<label class="block text-sm text-gray-600 mb-1">Projektname *</label>
					<input
						name="name"
						type="text"
						bind:value={newName}
						placeholder="z.B. 2026-05-06_Projekt scont GmbH"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				<div>
					<label class="block text-sm text-gray-600 mb-1">Notizen (optional)</label>
					<textarea
						name="notes"
						bind:value={newNotes}
						placeholder="z.B. Kunde: XY, Deadline: 15.06.2026"
						rows="2"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					></textarea>
				</div>
				<div class="flex gap-2 justify-end">
					<button type="button" onclick={() => showCreateForm = false} class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Abbrechen</button>
					<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Erstellen</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Suche, Filter & Sort -->
	<form method="GET" class="rounded-2xl p-5 space-y-3" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
		<div class="flex gap-3 flex-wrap">
			<input
				name="q"
				type="search"
				value={data.search}
				oninput={debouncedSubmit}
				placeholder="Projekte durchsuchen (Name)..."
				class="flex-1 min-w-[220px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<select
				name="sort"
				onchange={instantSubmit}
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="newest" selected={data.sort === 'newest'}>Neueste zuerst</option>
				<option value="name" selected={data.sort === 'name'}>Name A–Z</option>
			</select>
			<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">Suchen</button>
		</div>
		<div class="flex gap-3 flex-wrap items-center">
			<span class="text-xs text-gray-500 uppercase tracking-wide">Filter:</span>
			<select
				name="camera"
				onchange={instantSubmit}
				class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">Alle Kameras</option>
				{#each data.cameraOptions as cam}
					<option value={cam} selected={data.cameraFilter === cam}>{cam}</option>
				{/each}
			</select>
			<select
				name="lens"
				onchange={instantSubmit}
				class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option value="">Alle Objektive</option>
				{#each data.lensOptions as lens}
					<option value={lens} selected={data.lensFilter === lens}>{lens}</option>
				{/each}
			</select>
			{#if data.search || data.cameraFilter || data.lensFilter}
				<a href="/projects" class="text-xs text-blue-600 hover:underline">Alle Filter zurücksetzen</a>
			{/if}
			{#if data.cameraFilter || data.lensFilter}
				<span class="text-xs text-gray-500 ml-auto">
					Zeigt nur Projekte mit Dateien von
					{data.cameraFilter ? `Kamera "${data.cameraFilter}"` : ''}
					{data.cameraFilter && data.lensFilter ? ' und ' : ''}
					{data.lensFilter ? `Objektiv "${data.lensFilter}"` : ''}.
				</span>
			{/if}
		</div>
	</form>

	<!-- Projektliste -->
	{#if data.projects.length === 0}
		<div class="rounded-2xl px-5 py-20 text-center" style="background:var(--color-surface); border:1px solid var(--color-stroke);">
			<p class="text-[14px]" style="color:var(--color-ink-400)">
				{data.search ? `Keine Projekte für "${data.search}" gefunden.` : 'Noch keine Projekte vorhanden.'}
			</p>
		</div>
	{:else}
		<div class="rounded-2xl overflow-hidden" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
			{#each data.projects as project, i}
				<div class="px-6 py-4 flex items-center justify-between transition-colors" style={i > 0 ? 'border-top:1px solid var(--color-stroke);' : ''} onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--color-ink-50) 35%, transparent)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}>
					<div class="min-w-0 flex-1">
						<a href="/projects/{project.id}" class="text-[15px] font-medium transition-colors" style="color:var(--color-ink-900)">
							{project.name}
						</a>
						{#if project.notes}
							<p class="text-[12.5px] mt-0.5 truncate max-w-2xl" style="color:var(--color-ink-400)">{project.notes}</p>
						{/if}
						<div class="flex gap-4 mt-1.5 text-[12px]" style="color:var(--color-ink-400)">
							<span>{formatDate(project.created_at)}</span>
							{#if project.stats}
								<span>·</span>
								<span>{project.stats.import_count} Import{Number(project.stats.import_count) !== 1 ? 'e' : ''}</span>
								<span>·</span>
								<span>{project.stats.file_count ?? 0} Dateien</span>
								<span>·</span>
								<span>{formatSize(project.stats.total_size)}</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-4 ml-4 shrink-0">
						<a href="/projects/{project.id}" class="text-[13px] font-medium" style="color:var(--color-brand-500)">Öffnen →</a>
						<form method="POST" action="?/delete" use:enhance onsubmit={() => confirm('Projekt wirklich löschen?') || event?.preventDefault()}>
							<input type="hidden" name="id" value={project.id} />
							<button type="submit" class="text-[13px]" style="color:var(--color-ink-400)" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-danger)'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-400)'}>Löschen</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
