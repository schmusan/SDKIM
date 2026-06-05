<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Import-Einstellungen
	let folderStructure = $state(data.settings.folder_structure);
	let verifyChecksums = $state(data.settings.verify_checksums);
	let detectDuplicates = $state(data.settings.detect_duplicates);
	let projectNamePattern = $state(data.settings.project_name_pattern);
	let maxFileSizeGb = $state(data.settings.max_file_size_gb);

	// Template-Formular
	let showCreate = $state(false);
	let saved = $state(false);

	function previewFolder(pattern: string) {
		return pattern
			.replace('{camera}', 'SonyA7IV')
			.replace('{date}', '2026-05-06')
			.replace('{lens}', '24-70mm')
			.replace('{project}', 'Projekt_scont');
	}

	function previewProjectName(pattern: string) {
		return pattern
			.replace('{date}', '2026-05-06')
			.replace('{camera}', 'SonyA7IV');
	}

	const placeholders = [
		['{camera}', 'Kameramodell (z.B. SonyA7IV)'],
		['{date}', 'Aufnahmedatum (z.B. 2026-05-06)'],
		['{lens}', 'Objektiv (z.B. 24-70mm)'],
		['{project}', 'Projektname']
	];
</script>

<div class="max-w-2xl space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Einstellungen</h1>
		<p class="text-sm text-gray-500 mt-1">Standard-Konfiguration für Importe und Projekte</p>
	</div>

	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-md flex items-center gap-2">
			<span>✓</span> Einstellungen gespeichert
		</div>
	{/if}
	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">{form.error}</div>
	{/if}

	<form method="POST" action="?/saveSettings" use:enhance class="space-y-6">

		<!-- Ordnerstruktur -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<div>
				<h2 class="font-semibold text-gray-800">Standard-Ordnerstruktur</h2>
				<p class="text-xs text-gray-400 mt-0.5">Greift beim Import wenn kein Kamera-Profil passt</p>
			</div>
			<div>
				<label class="block text-sm text-gray-600 mb-1" for="folder_structure">Ordnermuster</label>
				<input
					id="folder_structure"
					name="folder_structure"
					type="text"
					bind:value={folderStructure}
					class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			{#if folderStructure}
				<div class="bg-gray-900 rounded-md px-4 py-2.5">
					<span class="text-xs text-gray-400">Vorschau: </span>
					<span class="text-xs text-green-400 font-mono">{previewFolder(folderStructure)}/</span>
				</div>
			{/if}
			<div class="bg-gray-50 rounded-md p-3">
				<p class="text-xs font-medium text-gray-500 mb-2">Verfügbare Platzhalter</p>
				<div class="grid grid-cols-2 gap-1.5">
					{#each placeholders as [ph, desc]}
						<div class="text-xs text-gray-500">
							<code class="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">{ph}</code>
							<span class="ml-1">{desc}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Projektnamen-Muster -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<div>
				<h2 class="font-semibold text-gray-800">Automatischer Projektname</h2>
				<p class="text-xs text-gray-400 mt-0.5">Wird verwendet wenn beim Import kein Projekt existiert</p>
			</div>
			<div>
				<label class="block text-sm text-gray-600 mb-1" for="project_name_pattern">Namensmuster</label>
				<input
					id="project_name_pattern"
					name="project_name_pattern"
					type="text"
					bind:value={projectNamePattern}
					class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			{#if projectNamePattern}
				<div class="bg-gray-900 rounded-md px-4 py-2.5">
					<span class="text-xs text-gray-400">Vorschau: </span>
					<span class="text-xs text-green-400 font-mono">{previewProjectName(projectNamePattern)}</span>
				</div>
			{/if}
		</div>

		<!-- Standard Import-Optionen -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<div>
				<h2 class="font-semibold text-gray-800">Standard Import-Optionen</h2>
				<p class="text-xs text-gray-400 mt-0.5">Vorausgewählte Optionen beim Starten eines Imports</p>
			</div>
			<div class="space-y-3">
				<label class="flex items-start gap-3 cursor-pointer">
					<input type="checkbox" name="verify_checksums" bind:checked={verifyChecksums} class="w-4 h-4 text-blue-600 mt-0.5" />
					<div>
						<span class="text-sm text-gray-800 font-medium">Prüfsummen verifizieren</span>
						<p class="text-xs text-gray-400">Stellt sicher, dass keine Bytes beim Kopieren verloren gingen (SHA-256)</p>
					</div>
				</label>
				<label class="flex items-start gap-3 cursor-pointer">
					<input type="checkbox" name="detect_duplicates" bind:checked={detectDuplicates} class="w-4 h-4 text-blue-600 mt-0.5" />
					<div>
						<span class="text-sm text-gray-800 font-medium">Duplikate erkennen</span>
						<p class="text-xs text-gray-400">Bereits importierte Dateien werden automatisch übersprungen</p>
					</div>
				</label>
			</div>
		</div>

		<!-- Dateifilter -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<div>
				<h2 class="font-semibold text-gray-800">Dateifilter</h2>
				<p class="text-xs text-gray-400 mt-0.5">Dateien über einem Grenzwert werden übersprungen</p>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex-1">
					<label class="block text-sm text-gray-600 mb-1" for="max_file_size_gb">Max. Dateigrösse (GB)</label>
					<input
						id="max_file_size_gb"
						name="max_file_size_gb"
						type="number"
						min="0"
						step="0.5"
						bind:value={maxFileSizeGb}
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<p class="text-xs text-gray-400 mt-5">0 = kein Limit</p>
			</div>
		</div>

		<div class="flex justify-end">
			<button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md text-sm transition-colors">
				Einstellungen speichern
			</button>
		</div>
	</form>

	<!-- Import-Vorlagen -->
	<div class="bg-white rounded-lg border border-gray-200">
		<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
			<div>
				<h2 class="font-semibold text-gray-800">Import-Vorlagen</h2>
				<p class="text-xs text-gray-400 mt-0.5">Gespeicherte Konfigurationen für wiederkehrende Imports</p>
			</div>
			<button onclick={() => showCreate = !showCreate} class="text-sm text-blue-600 hover:underline">
				+ Neue Vorlage
			</button>
		</div>

		{#if showCreate}
			<div class="px-5 py-4 border-b border-gray-100 bg-gray-50">
				<form
					method="POST"
					action="?/createTemplate"
					use:enhance={() => async ({ result, update }) => {
						await update();
						if (result.type === 'success') showCreate = false;
					}}
					class="space-y-3"
				>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-xs text-gray-500 mb-1">Name *</label>
							<input name="name" type="text" placeholder="z.B. Standard-Videoproduktion"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
						</div>
						<div>
							<label class="block text-xs text-gray-500 mb-1">Ordnerstruktur *</label>
							<input name="folder_structure" type="text" placeholder={'{camera}/{date}'}
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
						</div>
					</div>
					<div class="flex gap-6">
						{#each [['verify_checksums', 'Prüfsummen'], ['detect_duplicates', 'Duplikate'], ['rename_files', 'Umbenennen']] as [name, label]}
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
							<div class="flex gap-2 mt-1 flex-wrap">
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
		<div class="space-y-1 text-sm text-gray-600">
			<p>SD-Karten Import Management</p>
			<p>ZHAW Prototyping-Projekt 2026</p>
		</div>
	</div>
</div>
