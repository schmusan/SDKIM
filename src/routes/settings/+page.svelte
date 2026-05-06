<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showCreate = $state(false);
	let previewPattern = $state('{camera}/{date}');

	function previewFolder(pattern: string) {
		return pattern
			.replace('{camera}', 'SonyA7IV')
			.replace('{date}', '2026-05-06')
			.replace('{lens}', '24-70mm')
			.replace('{project}', 'Projekt_scont');
	}
</script>

<div class="max-w-2xl space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Einstellungen</h1>
		<p class="text-sm text-gray-500 mt-1">Systemoptionen und Import-Vorlagen</p>
	</div>

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">{form.error}</div>
	{/if}

	<!-- Ordnerstruktur -->
	<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
		<div>
			<h2 class="font-semibold text-gray-800">Standard-Ordnerstruktur</h2>
			<p class="text-xs text-gray-400 mt-0.5">Wird beim Import verwendet wenn kein Kamera-Profil greift</p>
		</div>
		<div>
			<label class="block text-sm text-gray-600 mb-1">Muster</label>
			<input
				type="text"
				bind:value={previewPattern}
				placeholder="{camera}/{date}"
				class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<div class="bg-gray-900 rounded-md px-4 py-2.5">
			<span class="text-xs text-gray-400">Vorschau: </span>
			<span class="text-xs text-green-400 font-mono">{previewFolder(previewPattern)}/</span>
		</div>
		<div class="text-xs text-gray-400 space-y-1">
			<p class="font-medium text-gray-500">Platzhalter:</p>
			<div class="grid grid-cols-2 gap-1">
				{#each [
					['{camera}', 'Kameramodell'],
					['{date}', 'Aufnahmedatum'],
					['{lens}', 'Objektiv'],
					['{project}', 'Projektname']
				] as [ph, desc]}
					<span><code class="bg-gray-100 px-1 rounded">{ph}</code> → {desc}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Import-Vorlagen -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
			<div>
				<h2 class="font-semibold text-gray-800">Import-Vorlagen</h2>
				<p class="text-xs text-gray-400 mt-0.5">Gespeicherte Konfigurationen für wiederkehrende Imports</p>
			</div>
			<button
				onclick={() => showCreate = !showCreate}
				class="text-sm text-blue-600 hover:underline"
			>+ Neue Vorlage</button>
		</div>

		{#if showCreate}
			<div class="px-5 py-4 border-b border-gray-100 bg-gray-50">
				<form method="POST" action="?/createTemplate" use:enhance={{ onResult: () => { showCreate = false; } }} class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-xs text-gray-500 mb-1">Name *</label>
							<input name="name" type="text" placeholder="z.B. Standard-Videoproduktion"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
						</div>
						<div>
							<label class="block text-xs text-gray-500 mb-1">Ordnerstruktur *</label>
							<input name="folder_structure" type="text" placeholder="{camera}/{date}"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
						</div>
					</div>
					<div class="flex gap-6">
						{#each [
							['verify_checksums', 'Prüfsummen verifizieren'],
							['detect_duplicates', 'Duplikate erkennen'],
							['rename_files', 'Dateien umbenennen']
						] as [name, label]}
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="checkbox" {name} class="w-4 h-4 text-blue-600" />
								<span class="text-sm text-gray-700">{label}</span>
							</label>
						{/each}
					</div>
					<div class="flex gap-2 justify-end">
						<button type="button" onclick={() => showCreate = false} class="text-sm text-gray-500 px-3 py-1.5">Abbrechen</button>
						<button type="submit" class="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-blue-700">Speichern</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="divide-y divide-gray-50">
			{#if data.templates.length === 0}
				<p class="px-5 py-8 text-sm text-gray-400 text-center">Noch keine Vorlagen gespeichert.</p>
			{:else}
				{#each data.templates as tpl}
					<div class="px-5 py-4 flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-900">{tpl.name}</p>
							<div class="flex gap-3 mt-1">
								<code class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tpl.folder_structure}</code>
								{#if tpl.verify_checksums}<span class="text-xs text-blue-600">✓ Prüfsummen</span>{/if}
								{#if tpl.detect_duplicates}<span class="text-xs text-blue-600">✓ Duplikate</span>{/if}
								{#if tpl.rename_files}<span class="text-xs text-blue-600">✓ Umbenennen</span>{/if}
							</div>
						</div>
						<form method="POST" action="?/deleteTemplate" use:enhance onsubmit={(e) => { if (!confirm('Vorlage löschen?')) e.preventDefault(); }}>
							<input type="hidden" name="id" value={tpl.id} />
							<button type="submit" class="text-xs text-red-400 hover:text-red-600">Löschen</button>
						</form>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Info -->
	<div class="bg-white rounded-lg border border-gray-200 p-5">
		<h2 class="font-semibold text-gray-800 mb-3">Über SDKIM</h2>
		<div class="space-y-1.5 text-sm text-gray-600">
			<p>SD-Karten Import Management – ZHAW Prototyping-Projekt</p>
			<p class="text-xs text-gray-400">SvelteKit · TypeScript · Drizzle ORM · SQLite · Tailwind CSS</p>
		</div>
	</div>
</div>
