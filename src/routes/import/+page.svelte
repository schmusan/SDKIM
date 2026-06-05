<script lang="ts">
	import { page } from '$app/stores';

	let { data, form } = $props();

	// Aus Evaluation: Projekt-Vorauswahl aus URL ?project=ID
	const prefilledProject = $page.url.searchParams.get('project') ?? '';

	let projectId = $state(prefilledProject);
	let newProjectName = $state('');
	let sdCardIds = $state<string[]>(['']);
	let cameraId = $state('');
	let newSdLabel = $state('');
	let newSdSerial = $state('');
	let newSdLens = $state('');
	let verifyChecksums = $state(true);
	let detectDuplicates = $state(true);
	let showFolderPreview = $state(false);
	let templateName = $state('');

	const selectedCameraModel = $derived(
		data.allCameras.find((c) => c.id === cameraId)?.model ?? null
	);

	function addSdCard() { sdCardIds = [...sdCardIds, '']; }
	function removeSdCard(i: number) { sdCardIds = sdCardIds.filter((_, idx) => idx !== i); }

	function folderPreview() {
		const cam = selectedCameraModel?.replace(/\s+/g, '') ?? 'SonyA7IV';
		return `${newProjectName || 'Projektname'}/\n├── ${cam}_24mm/\n│   ├── ${cam}_0001.MP4\n│   └── ${cam}_0002.ARW\n└── ${cam}_70mm/\n    └── ${cam}_0003.MP4`;
	}
</script>

<div class="max-w-2xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Import starten</h1>
		<p class="text-sm text-gray-500 mt-1">Konfiguriere den Import deiner SD-Karten</p>
	</div>

	{#if prefilledProject && data.allProjects.find((p) => p.id === prefilledProject)}
		<div class="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded-md">
			Projekt aus der Detailansicht übernommen: <strong>{data.allProjects.find((p) => p.id === prefilledProject)?.name}</strong>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
			{form.error}
		</div>
	{/if}

	<form method="POST" class="space-y-6">
		<!-- Projekt -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<h2 class="font-semibold text-gray-800">Projekt</h2>
			<div>
				<label class="block text-sm text-gray-600 mb-1" for="project_id">Projekt auswählen</label>
				<select
					id="project_id"
					name="project_id"
					bind:value={projectId}
					class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					<option value="">— Bitte wählen —</option>
					<option value="new">+ Neues Projekt erstellen</option>
					{#each data.allProjects as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</div>
			{#if projectId === 'new'}
				<div>
					<label class="block text-sm text-gray-600 mb-1" for="new_project_name">Projektname</label>
					<input
						id="new_project_name"
						name="new_project_name"
						type="text"
						bind:value={newProjectName}
						placeholder="z.B. 2026-05-06_Projekt scont GmbH"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			{/if}
		</div>

		<!-- SD-Karten -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold text-gray-800">SD-Karten</h2>
				<button
					type="button"
					onclick={addSdCard}
					class="text-xs text-blue-600 hover:underline"
				>+ Weitere hinzufügen</button>
			</div>

			{#each sdCardIds as cardId, i}
				<div class="flex items-center gap-2">
					<select
						name="sd_card_ids"
						bind:value={sdCardIds[i]}
						class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">— Karte auswählen —</option>
						<option value="new">+ Neue SD-Karte erfassen</option>
						{#each data.allSdCards as card}
							<option value={card.id}>{card.label} {card.serial ? `(${card.serial})` : ''}</option>
						{/each}
					</select>
					{#if sdCardIds.length > 1}
						<button
							type="button"
							onclick={() => removeSdCard(i)}
							class="text-gray-400 hover:text-red-500 text-lg leading-none"
						>×</button>
					{/if}
				</div>
			{/each}

			{#if sdCardIds.includes('new')}
				<div class="grid grid-cols-3 gap-3 pt-1">
					<div>
						<label class="block text-xs text-gray-500 mb-1">Label</label>
						<input
							name="new_sd_label"
							type="text"
							bind:value={newSdLabel}
							placeholder="z.B. SonyA7IV_Karte1"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-xs text-gray-500 mb-1 flex items-center gap-1">
							Seriennummer
							<span class="text-gray-300 cursor-help" title="Optional — Seriennummer der physischen SD-Karte. Hilft, dieselbe Karte später wiederzuerkennen, wenn das Label später geändert wird.">ⓘ</span>
						</label>
						<input
							name="new_sd_serial"
							type="text"
							bind:value={newSdSerial}
							placeholder="z.B. SD-20240001"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-xs text-gray-500 mb-1 flex items-center gap-1">
							Objektiv (manuell)
							<span class="text-gray-300 cursor-help" title="Optional — wird in den Importmetadaten ergänzt, falls die SD-Karte/Kamera keine EXIF-Objektivinformation mitliefert (z.B. Altobjektive ohne Elektronik).">ⓘ</span>
						</label>
						<input
							name="new_sd_lens"
							type="text"
							bind:value={newSdLens}
							placeholder="z.B. 24-70mm f/2.8"
							class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			{/if}
		</div>

		<!-- Kameraprofil -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
			<h2 class="font-semibold text-gray-800 flex items-center gap-2">
				Kameraprofil
				<span class="text-gray-300 cursor-help text-sm" title="Optional — wählt das Kameraprofil, das den importierten Dateien zugeordnet wird. Setzt den Kameramodell-Wert in den Metadaten konsistent. Ohne Auswahl werden Kameras aus EXIF/Demo-Daten gelesen.">ⓘ</span>
			</h2>
			<div>
				<label class="block text-sm text-gray-600 mb-1" for="camera_id">Kamera auswählen (optional)</label>
				<select
					id="camera_id"
					name="camera_id"
					bind:value={cameraId}
					class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">— Keine Auswahl (Auto / Demo) —</option>
					{#each data.allCameras as cam}
						<option value={cam.id}>{cam.model}</option>
					{/each}
				</select>
				{#if data.allCameras.length === 0}
					<p class="text-xs text-gray-400 mt-1">
						Noch keine Kameraprofile angelegt — <a href="/cameras" class="text-blue-600 hover:underline">jetzt eines anlegen</a>.
					</p>
				{:else if selectedCameraModel}
					<p class="text-xs text-blue-600 mt-1">Alle Dateien dieses Imports werden <strong>{selectedCameraModel}</strong> zugeordnet.</p>
				{/if}
			</div>
		</div>

		<!-- Optionen -->
		<div class="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
			<h2 class="font-semibold text-gray-800">Optionen</h2>
			<label class="flex items-center gap-3 cursor-pointer">
				<input type="checkbox" name="verify_checksums" bind:checked={verifyChecksums} class="w-4 h-4 text-blue-600" />
				<div>
					<span class="text-sm text-gray-800">Prüfsummen verifizieren</span>
					<p class="text-xs text-gray-400">Stellt sicher, dass keine Bytes beim Kopieren verloren gingen</p>
				</div>
			</label>
			<label class="flex items-center gap-3 cursor-pointer">
				<input type="checkbox" name="detect_duplicates" bind:checked={detectDuplicates} class="w-4 h-4 text-blue-600" />
				<div>
					<span class="text-sm text-gray-800">Duplikate erkennen</span>
					<p class="text-xs text-gray-400">Bereits importierte Dateien werden übersprungen</p>
				</div>
			</label>
			<label class="flex items-center gap-3 cursor-pointer">
				<input type="checkbox" bind:checked={showFolderPreview} class="w-4 h-4 text-blue-600" />
				<span class="text-sm text-gray-800">Ordnervorschau anzeigen</span>
			</label>
		</div>

		<!-- Ordnervorschau -->
		{#if showFolderPreview}
			<div class="bg-gray-900 rounded-lg p-4">
				<p class="text-xs text-gray-400 mb-2 font-medium">Vorschau der Ordnerstruktur</p>
				<pre class="text-xs text-green-400 font-mono whitespace-pre">{folderPreview()}</pre>
			</div>
		{/if}

		<!-- Template speichern -->
		<div class="bg-white rounded-lg border border-gray-200 p-5">
			<h2 class="font-semibold text-gray-800 mb-1 flex items-center gap-2">
				Als Vorlage speichern (optional)
				<span class="text-gray-300 cursor-help text-sm" title="Vorlagen speichern die aktuellen Importoptionen (Verifizierung, Duplikatserkennung, Ordnerstruktur) unter einem Namen. Beim nächsten Import kannst du die Vorlage aus den Einstellungen auswählen, statt alles neu zu konfigurieren.">ⓘ</span>
			</h2>
			<p class="text-xs text-gray-500 mb-3">Sichert die aktuellen Optionen unter einem Namen für spätere Importe.</p>
			<input
				name="template_name"
				type="text"
				bind:value={templateName}
				placeholder="z.B. Standard-Videoproduktion"
				class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<p class="text-xs text-gray-400 mt-1">Leer lassen, um nichts zu speichern.</p>
		</div>

		<div class="flex justify-end">
			<button
				type="submit"
				class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md text-sm transition-colors"
			>
				Import starten →
			</button>
		</div>
	</form>
</div>
