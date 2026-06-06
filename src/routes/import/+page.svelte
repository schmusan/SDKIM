<script lang="ts">
	import { page } from '$app/stores';
	import Tooltip from '$lib/components/Tooltip.svelte';

	let { data, form } = $props();

	// Aus Evaluation: Projekt-Vorauswahl aus URL ?project=ID
	const prefilledProject = $page.url.searchParams.get('project') ?? '';
	// Aus Dashboard-Toast: einzelne registrierte Karte via ?sd_card=ID
	const prefilledSdCard = $page.url.searchParams.get('sd_card') ?? '';
	// Aus Dashboard-Toast: erkannte (Demo-)Karten via ?detected=Label|Serial|Lens (mehrfach möglich)
	const detectedFromUrl = $page.url.searchParams
		.getAll('detected')
		.map((s) => {
			const [label, serial, lens] = s.split('|');
			return {
				label: label?.trim() ?? '',
				serial: serial?.trim() ?? '',
				lens: lens?.trim() ?? ''
			};
		})
		.filter((c) => c.label);

	// Wizard-State — startet immer bei Schritt 1 (SD-Karten)
	let step = $state(1);

	let projectId = $state(prefilledProject);
	let newProjectName = $state('');

	// Neue Karten (vom Toast erkannt oder manuell ergänzt). Label = Kameraname, lens = ausgelesenes Objektiv.
	type NewCard = {
		label: string;
		serial: string;
		lens: string;
		selected: boolean;
		cameraOverride?: string;
	};
	let newCards = $state<NewCard[]>(
		detectedFromUrl.map((c) => ({
			label: c.label,
			serial: c.serial,
			lens: c.lens,
			selected: true
		}))
	);
	let verifyChecksums = $state(true);
	let detectDuplicates = $state(true);
	let showFolderPreview = $state(false);
	let templateName = $state('');

	function toggleNewCard(idx: number) {
		newCards = newCards.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c));
	}
	function addManualNewCard(label: string, serial: string) {
		const l = label.trim();
		if (!l) return;
		newCards = [...newCards, { label: l, serial: serial.trim(), selected: true }];
	}
	function removeNewCard(idx: number) {
		newCards = newCards.filter((_, i) => i !== idx);
	}

	const steps = [
		{ n: 1, label: 'SD-Karten' },
		{ n: 2, label: 'Projekt & Optionen' },
		{ n: 3, label: 'Übersicht' }
	];

	const selectedProject = $derived(data.allProjects.find((p) => p.id === projectId));
	const selectedNewCards = $derived(newCards.filter((c) => c.selected && c.label.trim()));

	// Pro Karte: welches Kameramodell + Objektiv verwendet wird (für Server-Action und Übersicht)
	function cameraForNewCard(card: NewCard): string {
		if (card.cameraOverride) {
			const cam = data.allCameras.find((c) => c.id === card.cameraOverride);
			if (cam) return cam.model;
		}
		return card.label;
	}

	// Liste der für den Import aktiven Karten
	const resolvedSdCards = $derived(
		selectedNewCards.map((c) => ({
			id: 'new',
			label: c.label,
			serial: c.serial,
			camera: cameraForNewCard(c),
			lens: c.lens,
			isNew: true
		}))
	);

	const sdCardsValid = $derived(resolvedSdCards.length > 0);
	const hasAnyCard = $derived(newCards.length > 0);
	let showManualForm = $state(false);
	const formOpen = $derived(!hasAnyCard || showManualForm);
	const projectValid = $derived(
		projectId !== '' && (projectId !== 'new' || newProjectName.trim().length > 0)
	);

	function canAdvance(currentStep: number): boolean {
		if (currentStep === 1) return sdCardsValid;
		if (currentStep === 2) return projectValid;
		return true;
	}

	function next() {
		if (canAdvance(step) && step < 3) step += 1;
	}
	function prev() {
		if (step > 1) step -= 1;
	}

	function folderPreview() {
		const camRaw = resolvedSdCards[0]?.camera ?? 'SonyA7IV';
		const cam = camRaw.replace(/\s+/g, '');
		return `${newProjectName || 'Projektname'}/\n├── ${cam}_24mm/\n│   ├── ${cam}_0001.MP4\n│   └── ${cam}_0002.ARW\n└── ${cam}_70mm/\n    └── ${cam}_0003.MP4`;
	}
</script>

<div class="max-w-3xl space-y-7">
	<div>
		<h1 class="text-[32px] font-semibold leading-[1.15] tracking-tight" style="color:var(--color-ink-900)">Import starten</h1>
		<p class="text-[15px] mt-1.5" style="color:var(--color-ink-500)">Konfiguriere den Import deiner SD-Karten in 3 Schritten.</p>
	</div>

	{#if prefilledProject && data.allProjects.find((p) => p.id === prefilledProject)}
		<div class="rounded-xl px-4 py-2.5 text-[13.5px]" style="background:var(--color-brand-50); border:1px solid var(--color-brand-100); color:var(--color-brand-700);">
			Projekt aus der Detailansicht übernommen: <strong>{data.allProjects.find((p) => p.id === prefilledProject)?.name}</strong>
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-xl px-4 py-3 text-[13.5px]" style="background:var(--color-danger-soft); border:1px solid color-mix(in srgb, var(--color-danger) 25%, transparent); color:var(--color-danger);">
			{form.error}
		</div>
	{/if}

	<!-- Step indicator -->
	<div class="rounded-2xl px-7 py-5" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
		<ol class="flex items-center justify-between gap-2">
			{#each steps as s, idx}
				{@const done = step > s.n}
				{@const active = step === s.n}
				<li class="flex-1 flex items-center gap-3 min-w-0">
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 transition-all duration-200"
							style={done
								? 'background:var(--color-success); color:#fff'
								: active
								? 'background:var(--color-brand-500); color:#fff'
								: 'background:var(--color-ink-50); color:var(--color-ink-400)'}
						>
							{#if done}✓{:else}{s.n}{/if}
						</div>
						<span
							class="text-[14px] font-medium truncate"
							style={done
								? 'color:var(--color-success)'
								: active
								? 'color:var(--color-ink-900)'
								: 'color:var(--color-ink-400)'}
						>
							{s.label}
						</span>
					</div>
					{#if idx < steps.length - 1}
						<div class="flex-1 h-[2px] mx-3 rounded-full transition-colors" style={done ? 'background:var(--color-success)' : 'background:var(--color-stroke)'}></div>
					{/if}
				</li>
			{/each}
		</ol>
	</div>

	<form method="POST">
		<!-- Step 1: SD-Karten als Karten-Auswahl -->
		<div class:hidden={step !== 1}>
			<div class="rounded-2xl p-7 space-y-6" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 1 — SD-Karten</h2>
					<p class="text-sm text-gray-500 mt-0.5">Wähle die Karten aus, die importiert werden sollen.</p>
				</div>

				<!-- Frisch erkannte Karten (vom Dashboard-Toast) -->
				{#if newCards.length > 0}
					<div>
						<div class="flex items-center justify-between mb-2">
							<h3 class="text-xs font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-2">
								<span class="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
								Frisch erkannt ({newCards.length})
							</h3>
							<span class="text-xs text-gray-400">Werden beim Import in den Stammdaten angelegt</span>
						</div>
						<div class="grid grid-cols-2 gap-3">
							{#each newCards as card, i}
								<div
									class="text-left p-4 rounded-lg border-2 transition-all
										{card.selected
											? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100'
											: 'border-gray-200 bg-white opacity-60'}"
								>
									<div class="flex items-start justify-between gap-3">
										<button type="button" onclick={() => toggleNewCard(i)} class="flex items-start gap-2 min-w-0 flex-1 text-left">
											<div class="w-8 h-8 rounded-md {card.selected ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center shrink-0">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4 {card.selected ? 'text-blue-600' : 'text-gray-400'}">
													<rect x="6" y="3" width="12" height="18" rx="2"/>
													<line x1="9" y1="7" x2="9" y2="9"/>
													<line x1="12" y1="7" x2="12" y2="9"/>
													<line x1="15" y1="7" x2="15" y2="9"/>
												</svg>
											</div>
											<div class="min-w-0">
												<div class="flex items-center gap-1.5">
													<p class="text-sm font-semibold text-gray-900 truncate">{card.label}</p>
													<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">Neu</span>
												</div>
												{#if card.lens}
													<p class="text-xs text-gray-600 truncate">{card.lens}</p>
												{/if}
												{#if card.serial}
													<p class="text-[11px] text-gray-400 truncate font-mono">{card.serial}</p>
												{/if}
											</div>
										</button>
										<div class="flex items-center gap-1 shrink-0">
											<button
												type="button"
												onclick={() => toggleNewCard(i)}
												class="w-5 h-5 rounded-full border-2 flex items-center justify-center
													{card.selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}"
												aria-label="Auswahl umschalten"
											>
												{#if card.selected}
													<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" class="w-3 h-3">
														<polyline points="4 12 10 18 20 6"/>
													</svg>
												{/if}
											</button>
											<button
												type="button"
												onclick={() => removeNewCard(i)}
												class="text-gray-300 hover:text-red-500 text-lg leading-none px-1"
												aria-label="Karte entfernen"
											>×</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Registrierte Karten -->
				<!-- Manuelle Karte hinzufügen — Dropdown bei vorhandenen Karten, offen bei leerem State -->
				<div class="rounded-lg border {hasAnyCard ? 'border-dashed border-gray-300' : 'border-blue-200 bg-blue-50/40'}">
					{#if !hasAnyCard}
						<div class="px-4 pt-4 pb-2 flex items-start gap-3">
							<div class="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
									<circle cx="12" cy="12" r="10"/>
									<line x1="12" y1="8" x2="12" y2="12"/>
									<line x1="12" y1="16" x2="12.01" y2="16"/>
								</svg>
							</div>
							<div>
								<p class="text-sm font-semibold text-blue-900">Keine weiteren SD-Karten erkannt</p>
								<p class="text-xs text-blue-700 mt-0.5">Möchtest du eine Karte manuell hinzufügen?</p>
							</div>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => (showManualForm = !showManualForm)}
							class="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center justify-between"
							aria-expanded={showManualForm}
						>
							<span>+ Weitere Karte manuell hinzufügen</span>
							<span class="text-gray-400 text-xs transition-transform {showManualForm ? 'rotate-180' : ''}">▾</span>
						</button>
					{/if}
					{#if formOpen}
						<div class="px-4 py-3 border-t {hasAnyCard ? 'border-dashed border-gray-200' : 'border-blue-100'} space-y-2">
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="text-xs text-gray-500 mb-1 flex items-center gap-1.5" for="manual_label">
									Label *
									<Tooltip text="Sprechender Name. Wenn er auf ein Kameramodell hindeutet (z.B. 'Sony A7 IV'), wird das automatisch übernommen." />
								</label>
								<input
									type="text"
									placeholder="z.B. SonyA7IV_Karte1"
									id="manual_label"
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label class="text-xs text-gray-500 mb-1 block" for="manual_serial">Seriennummer (optional)</label>
								<input
									type="text"
									placeholder="z.B. SD-20240001"
									id="manual_serial"
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="text-xs text-gray-500 mb-1 flex items-center gap-1.5" for="manual_camera">
									Kameraprofil
									<Tooltip text="Nur nötig, wenn das Label nicht selbst schon das Kameramodell verrät." />
								</label>
								<select
									id="manual_camera"
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">— aus Label ableiten —</option>
									{#each data.allCameras as cam}
										<option value={cam.id}>{cam.model}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="text-xs text-gray-500 mb-1 block" for="manual_lens">Objektiv</label>
								<input
									type="text"
									placeholder="z.B. 24-70mm f/2.8"
									id="manual_lens"
									class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						</div>
						<!-- Versteckter Datei-/Ordner-Picker -->
						<input
							type="file"
							id="sd_picker"
							webkitdirectory
							class="hidden"
							onchange={(e) => {
								const target = e.currentTarget as HTMLInputElement;
								const files = target.files;
								if (!files || files.length === 0) return;
								// Erster File-Pfad enthält den Ordnernamen
								const first = files[0] as File & { webkitRelativePath?: string };
								const folderName = first.webkitRelativePath?.split('/')[0] ?? first.name;
								const labelEl = document.getElementById('manual_label') as HTMLInputElement | null;
								if (labelEl && !labelEl.value.trim()) labelEl.value = folderName;
								target.value = '';
							}}
						/>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => document.getElementById('sd_picker')?.click()}
								class="flex-1 border border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
								title="Ordner der SD-Karte im Finder/Explorer wählen"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4">
									<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
								</svg>
								SD-Karte im Finder auswählen
							</button>
							<button
								type="button"
								onclick={() => {
									const labelEl = document.getElementById('manual_label') as HTMLInputElement | null;
									const serialEl = document.getElementById('manual_serial') as HTMLInputElement | null;
									const cameraEl = document.getElementById('manual_camera') as HTMLSelectElement | null;
									const lensEl = document.getElementById('manual_lens') as HTMLInputElement | null;
									if (labelEl?.value.trim()) {
										const card: NewCard = {
											label: labelEl.value.trim(),
											serial: serialEl?.value.trim() ?? '',
											lens: lensEl?.value.trim() ?? '',
											selected: true,
											cameraOverride: cameraEl?.value || undefined
										};
										newCards = [...newCards, card];
										labelEl.value = '';
										if (serialEl) serialEl.value = '';
										if (cameraEl) cameraEl.value = '';
										if (lensEl) lensEl.value = '';
									}
								}}
								class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
							>+ Karte hinzufügen</button>
						</div>
					</div>
					{/if}
				</div>

				<!-- Hidden Inputs: neue Karten inkl. Kamera- und Objektiv-Zuordnung -->
				{#each selectedNewCards as card}
					<input type="hidden" name="sd_card_ids" value="new" />
					<input type="hidden" name="new_sd_labels" value={card.label} />
					<input type="hidden" name="new_sd_serials" value={card.serial} />
					<input type="hidden" name="card_cameras" value={cameraForNewCard(card)} />
					<input type="hidden" name="card_lenses" value={card.lens} />
				{/each}

				{#if resolvedSdCards.length > 0}
					<div class="bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-xs text-gray-600">
						<strong>{resolvedSdCards.length}</strong> Karte{resolvedSdCards.length !== 1 ? 'n' : ''} ausgewählt: {resolvedSdCards.map((c) => c.label).join(' · ')}
					</div>
				{:else}
					<p class="text-xs text-gray-400 text-center py-2">Wähle mindestens eine Karte aus, um fortzufahren.</p>
				{/if}
			</div>
		</div>

		<!-- (Schritt 2 entfernt — Kamerazuordnung erfolgt jetzt inline in Schritt 1 pro Karte) -->

		<!-- Step 2: Projekt & Optionen (zusammengelegt) -->
		<div class:hidden={step !== 2}>
			<div class="rounded-2xl p-7 space-y-5" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 2 — Projekt & Optionen</h2>
					<p class="text-sm text-gray-500 mt-0.5">Wähle das Zielprojekt und passe das Importverhalten an.</p>
				</div>

				<!-- Projekt-Block -->
				<div class="space-y-3">
					<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-600">Projekt</h3>
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

				<!-- Optionen-Block -->
				<div class="space-y-3 pt-4 border-t border-gray-100">
					<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-600">Optionen</h3>
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
						<Tooltip text="Vorlagen speichern die aktuellen Importoptionen unter einem Namen. Beim nächsten Import kannst du die Vorlage aus den Einstellungen auswählen, statt alles neu zu konfigurieren." />
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

		<!-- Step 3: Übersicht / Bestätigung -->
		<div class:hidden={step !== 3}>
			<div class="rounded-2xl p-7 space-y-5" style="background:var(--color-surface); border:1px solid var(--color-stroke); box-shadow:var(--shadow-soft);">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Schritt 3 — Übersicht</h2>
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
						<dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">SD-Karten & Kameras</dt>
						<dd class="col-span-2 text-sm text-gray-900">
							{#if resolvedSdCards.length === 0}
								<span class="text-red-600">Keine Karten gewählt</span>
							{:else}
								<ul class="space-y-2">
									{#each resolvedSdCards as card}
										<li class="flex items-start justify-between gap-2">
											<div class="flex flex-col gap-0.5">
												<span class="flex items-center gap-1.5">
													{#if card.isNew}
														<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide font-medium">Neu</span>
													{/if}
													{card.label}
												</span>
												{#if card.serial}
													<span class="text-xs text-gray-400 font-mono">{card.serial}</span>
												{/if}
											</div>
											<div class="text-right text-xs text-gray-600 space-y-0.5">
												<div>→ <strong>{card.camera}</strong></div>
												{#if card.lens}
													<div class="text-gray-500">{card.lens}</div>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</dd>
					</div>

					<div class="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50">
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

					<div class="grid grid-cols-3 gap-4 px-4 py-3">
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
				class="rounded-full text-[14px] font-semibold px-5 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
				style="background:var(--color-surface); border:1px solid var(--color-stroke-strong); color:var(--color-ink-700); box-shadow:var(--shadow-soft);"
			>
				← Zurück
			</button>

			<span class="text-[12px]" style="color:var(--color-ink-400)">Schritt {step} von {steps.length}</span>

			{#if step < 3}
				<button
					type="button"
					onclick={next}
					disabled={!canAdvance(step)}
					class="rounded-full text-[14px] font-semibold px-5 py-2.5 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
					style="background:var(--color-brand-500); box-shadow:var(--shadow-soft);"
					onmouseenter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-600)'; }}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-500)'}
				>
					Weiter →
				</button>
			{:else}
				<button
					type="submit"
					class="rounded-full text-[14px] font-semibold px-6 py-2.5 text-white transition-all"
					style="background:var(--color-success); box-shadow:var(--shadow-soft);"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = '#2ba946'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-success)'}
				>
					Import bestätigen ✓
				</button>
			{/if}
		</div>
	</form>
</div>
