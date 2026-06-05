<script lang="ts">
	import { page } from '$app/stores';

	let { data, form } = $props();

	// Aus Evaluation: Projekt-Vorauswahl aus URL ?project=ID
	const prefilledProject = $page.url.searchParams.get('project') ?? '';

	// Wizard-State
	let step = $state(1);

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

	const steps = [
		{ n: 1, label: 'Projekt' },
		{ n: 2, label: 'SD-Karten' },
		{ n: 3, label: 'Kameraprofil' },
		{ n: 4, label: 'Optionen' },
		{ n: 5, label: 'Übersicht' }
	];

	const selectedProject = $derived(data.allProjects.find((p) => p.id === projectId));
	const selectedCameraModel = $derived(
		data.allCameras.find((c) => c.id === cameraId)?.model ?? null
	);
	const resolvedSdCards = $derived(
		sdCardIds.map((id) => {
			if (id === 'new') return { id: 'new', label: newSdLabel || '(neue Karte)' };
			const card = data.allSdCards.find((c) => c.id === id);
			return card ? { id: card.id, label: card.label } : null;
		}).filter(Boolean) as { id: string; label: string }[]
	);

	const step1Valid = $derived(
		projectId !== '' && (projectId !== 'new' || newProjectName.trim().length > 0)
	);
	const step2Valid = $derived(
		sdCardIds.length > 0 &&
			sdCardIds.every((id) => id !== '') &&
			(!sdCardIds.includes('new') || newSdLabel.trim().length > 0)
	);

	function canAdvance(currentStep: number): boolean {
		if (currentStep === 1) return step1Valid;
		if (currentStep === 2) return step2Valid;
		return true;
	}

	function next() {
		if (canAdvance(step) && step < 5) step += 1;
	}
	function prev() {
		if (step > 1) step -= 1;
	}

	function addSdCard() { sdCardIds = [...sdCardIds, '']; }
	function removeSdCard(i: number) { sdCardIds = sdCardIds.filter((_, idx) => idx !== i); }

	function folderPreview() {
		const cam = selectedCameraModel?.replace(/\s+/g, '') ?? 'SonyA7IV';
		return `${newProjectName || 'Projektname'}/\n├── ${cam}_24mm/\n│   ├── ${cam}_0001.MP4\n│   └── ${cam}_0002.ARW\n└── ${cam}_70mm/\n    └── ${cam}_0003.MP4`;
	}
</script>

<div class="max-w-3xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Import starten</h1>
		<p class="text-sm text-gray-500 mt-1">Konfiguriere den Import deiner SD-Karten in 5 Schritten</p>
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

	<!-- Step indicator -->
	<div class="bg-white rounded-lg border border-gray-200 px-6 py-5">
		<ol class="flex items-center justify-between gap-2">
			{#each steps as s, idx}
				{@const done = step > s.n}
				{@const active = step === s.n}
				<li class="flex-1 flex items-center gap-3 min-w-0">
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors
								{done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}"
						>
							{#if done}✓{:else}{s.n}{/if}
						</div>
						<span
							class="text-sm font-medium truncate
								{done ? 'text-green-700' : active ? 'text-gray-900' : 'text-gray-400'}"
						>
							{s.label}
						</span>
					</div>
					{#if idx < steps.length - 1}
						<div class="flex-1 h-0.5 mx-2 rounded-full {done ? 'bg-green-500' : 'bg-gray-200'}"></div>
					{/if}
				</li>
			{/each}
		</ol>
	</div>

	<form method="POST">
		<!-- Step 1: Projekt -->
		<div class:hidden={step !== 1}>
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 1 — Projekt</h2>
					<p class="text-sm text-gray-500 mt-0.5">Wähle das Zielprojekt für diesen Import oder lege ein neues an.</p>
				</div>
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
		</div>

		<!-- Step 2: SD-Karten -->
		<div class:hidden={step !== 2}>
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-gray-900">Schritt 2 — SD-Karten</h2>
						<p class="text-sm text-gray-500 mt-0.5">Wähle eine oder mehrere SD-Karten, die importiert werden sollen.</p>
					</div>
					<button type="button" onclick={addSdCard} class="text-xs text-blue-600 hover:underline shrink-0 mt-1">
						+ Weitere hinzufügen
					</button>
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
					<div class="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100 mt-2">
						<div>
							<label class="block text-xs text-gray-500 mb-1 mt-3">Label</label>
							<input
								name="new_sd_label"
								type="text"
								bind:value={newSdLabel}
								placeholder="z.B. SonyA7IV_Karte1"
								class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label class="block text-xs text-gray-500 mb-1 mt-3 flex items-center gap-1">
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
							<label class="block text-xs text-gray-500 mb-1 mt-3 flex items-center gap-1">
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
		</div>

		<!-- Step 3: Kameraprofil -->
		<div class:hidden={step !== 3}>
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
						Schritt 3 — Kameraprofil
						<span class="text-gray-300 cursor-help text-sm" title="Wählt das Kameraprofil, das den importierten Dateien zugeordnet wird. Setzt den Kameramodell-Wert in den Metadaten konsistent. Ohne Auswahl werden Kameras aus EXIF/Demo-Daten gelesen.">ⓘ</span>
					</h2>
					<p class="text-sm text-gray-500 mt-0.5">Optional — alle Dateien dieses Imports werden der gewählten Kamera zugeordnet.</p>
				</div>
				<div>
					<label class="block text-sm text-gray-600 mb-1" for="camera_id">Kamera auswählen</label>
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
		</div>

		<!-- Step 4: Optionen + Vorlage -->
		<div class:hidden={step !== 4}>
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 4 — Optionen & Vorlage</h2>
					<p class="text-sm text-gray-500 mt-0.5">Importverhalten festlegen und optional als Vorlage speichern.</p>
				</div>

				<div class="space-y-3 pt-2">
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

				{#if showFolderPreview}
					<div class="bg-gray-900 rounded-lg p-4">
						<p class="text-xs text-gray-400 mb-2 font-medium">Vorschau der Ordnerstruktur</p>
						<pre class="text-xs text-green-400 font-mono whitespace-pre">{folderPreview()}</pre>
					</div>
				{/if}

				<div class="pt-4 border-t border-gray-100">
					<label class="block text-sm font-medium text-gray-800 mb-1 flex items-center gap-2" for="template_name">
						Als Vorlage speichern (optional)
						<span class="text-gray-300 cursor-help text-sm" title="Vorlagen speichern die aktuellen Importoptionen unter einem Namen. Beim nächsten Import kannst du die Vorlage aus den Einstellungen auswählen, statt alles neu zu konfigurieren.">ⓘ</span>
					</label>
					<input
						id="template_name"
						name="template_name"
						type="text"
						bind:value={templateName}
						placeholder="z.B. Standard-Videoproduktion"
						class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<p class="text-xs text-gray-400 mt-1">Leer lassen, um nichts zu speichern.</p>
				</div>
			</div>
		</div>

		<!-- Step 5: Übersicht / Bestätigung -->
		<div class:hidden={step !== 5}>
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 5 — Übersicht</h2>
					<p class="text-sm text-gray-500 mt-0.5">Bitte prüfe deine Eingaben, bevor der Import gestartet wird.</p>
				</div>

				<dl class="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
					<div class="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50">
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Projekt</dt>
						<dd class="col-span-2 text-sm text-gray-900">
							{#if projectId === 'new'}
								<span class="inline-flex items-center gap-1.5">
									<span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Neu</span>
									{newProjectName || '— Kein Name —'}
								</span>
							{:else if selectedProject}
								{selectedProject.name}
							{:else}
								<span class="text-red-600">Kein Projekt gewählt</span>
							{/if}
						</dd>
					</div>

					<div class="grid grid-cols-3 gap-4 px-4 py-3">
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">SD-Karten</dt>
						<dd class="col-span-2 text-sm text-gray-900">
							{#if resolvedSdCards.length === 0}
								<span class="text-red-600">Keine Karten gewählt</span>
							{:else}
								<ul class="space-y-1">
									{#each resolvedSdCards as card}
										<li class="flex items-center gap-1.5">
											{#if card.id === 'new'}
												<span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Neu</span>
											{/if}
											{card.label}
										</li>
									{/each}
								</ul>
								{#if sdCardIds.includes('new') && newSdSerial}
									<p class="text-xs text-gray-500 mt-1">Seriennummer: {newSdSerial}</p>
								{/if}
								{#if sdCardIds.includes('new') && newSdLens}
									<p class="text-xs text-gray-500">Objektiv: {newSdLens}</p>
								{/if}
							{/if}
						</dd>
					</div>

					<div class="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50">
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Kameraprofil</dt>
						<dd class="col-span-2 text-sm text-gray-900">
							{selectedCameraModel ?? 'Keine Auswahl (Auto / Demo)'}
						</dd>
					</div>

					<div class="grid grid-cols-3 gap-4 px-4 py-3">
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Optionen</dt>
						<dd class="col-span-2 text-sm text-gray-900 space-y-0.5">
							<p class="flex items-center gap-2">
								<span class={verifyChecksums ? 'text-green-600' : 'text-gray-300'}>{verifyChecksums ? '✓' : '○'}</span>
								Prüfsummen verifizieren
							</p>
							<p class="flex items-center gap-2">
								<span class={detectDuplicates ? 'text-green-600' : 'text-gray-300'}>{detectDuplicates ? '✓' : '○'}</span>
								Duplikate erkennen
							</p>
						</dd>
					</div>

					<div class="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50">
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Vorlage</dt>
						<dd class="col-span-2 text-sm text-gray-900">
							{templateName.trim() || 'Wird nicht gespeichert'}
						</dd>
					</div>
				</dl>

				<div class="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-md">
					Mit Klick auf <strong>Import bestätigen</strong> wird der Importprozess gestartet. Du wirst zur Fortschritts-Anzeige weitergeleitet.
				</div>
			</div>
		</div>

		<!-- Footer Navigation -->
		<div class="flex items-center justify-between mt-6">
			<button
				type="button"
				onclick={prev}
				disabled={step === 1}
				class="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			>
				← Zurück
			</button>

			<span class="text-xs text-gray-400">Schritt {step} von {steps.length}</span>

			{#if step < 5}
				<button
					type="button"
					onclick={next}
					disabled={!canAdvance(step)}
					class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					Weiter →
				</button>
			{:else}
				<button
					type="submit"
					class="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
				>
					Import bestätigen ✓
				</button>
			{/if}
		</div>
	</form>
</div>
