<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip, Legend);

	let { data } = $props();

	let barCanvas = $state<HTMLCanvasElement | null>(null);
	let donutCanvas = $state<HTMLCanvasElement | null>(null);
	let formatCanvas = $state<HTMLCanvasElement | null>(null);

	function formatSize(bytes: number) {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
		return (bytes / 1024).toFixed(0) + ' KB';
	}

	const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

	onMount(() => {
		// Speicher pro Projekt (Bar)
		if (barCanvas && data.projectStats.length > 0) {
			new Chart(barCanvas, {
				type: 'bar',
				data: {
					labels: data.projectStats.slice(0, 8).map(p => p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name),
					datasets: [{
						label: 'Speicher (GB)',
						data: data.projectStats.slice(0, 8).map(p => +(p.total_size / 1073741824).toFixed(2)),
						backgroundColor: '#3b82f6',
						borderRadius: 4
					}]
				},
				options: {
					responsive: true,
					plugins: { legend: { display: false } },
					scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + ' GB' } } }
				}
			});
		}

		// Dateien nach Kamera (Donut)
		if (donutCanvas && data.byCamera.length > 0) {
			new Chart(donutCanvas, {
				type: 'doughnut',
				data: {
					labels: data.byCamera.map(c => c.camera),
					datasets: [{
						data: data.byCamera.map(c => c.file_count),
						backgroundColor: colors,
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
					cutout: '65%'
				}
			});
		}

		// Dateien nach Format (Donut)
		if (formatCanvas && Object.keys(data.byFormat).length > 0) {
			const entries = Object.entries(data.byFormat).sort((a, b) => b[1].count - a[1].count);
			new Chart(formatCanvas, {
				type: 'doughnut',
				data: {
					labels: entries.map(([ext]) => ext),
					datasets: [{
						data: entries.map(([, v]) => v.count),
						backgroundColor: colors,
						borderWidth: 0
					}]
				},
				options: {
					responsive: true,
					plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
					cutout: '65%'
				}
			});
		}
	});
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Statistiken</h1>
		<p class="text-sm text-gray-500 mt-1">Übersicht über alle Importe und Dateien</p>
	</div>

	<!-- Gesamtzahlen -->
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: 'Importe total', value: data.totals.imports },
			{ label: 'Dateien total', value: data.totals.files },
			{ label: 'Gesamt importiert', value: formatSize(data.totals.size) },
			{ label: 'Duplikate erkannt', value: data.totals.duplicates }
		] as stat}
			<div class="bg-white rounded-lg border border-gray-200 p-5 text-center">
				<p class="text-xs text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
				<p class="text-3xl font-bold text-gray-900">{stat.value}</p>
			</div>
		{/each}
	</div>

	{#if data.totals.files === 0}
		<div class="bg-white rounded-lg border border-gray-200 px-5 py-16 text-center">
			<p class="text-gray-400 text-sm">Noch keine Daten vorhanden. Starte einen Import um Statistiken zu sehen.</p>
		</div>
	{:else}
		<!-- Charts Zeile 1 -->
		<div class="grid grid-cols-2 gap-6">
			<div class="bg-white rounded-lg border border-gray-200 p-5">
				<h2 class="font-semibold text-gray-800 mb-4">Speicher nach Projekt</h2>
				<canvas bind:this={barCanvas} height="200"></canvas>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-white rounded-lg border border-gray-200 p-5">
					<h2 class="font-semibold text-gray-800 mb-4 text-sm">Nach Kamera</h2>
					<canvas bind:this={donutCanvas}></canvas>
				</div>
				<div class="bg-white rounded-lg border border-gray-200 p-5">
					<h2 class="font-semibold text-gray-800 mb-4 text-sm">Nach Format</h2>
					<canvas bind:this={formatCanvas}></canvas>
				</div>
			</div>
		</div>

		<!-- Projekttabelle -->
		<div class="bg-white rounded-lg border border-gray-200">
			<div class="px-5 py-4 border-b border-gray-100">
				<h2 class="font-semibold text-gray-800">Projekte im Detail</h2>
			</div>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
						<th class="px-5 py-3 text-left">Projekt</th>
						<th class="px-5 py-3 text-right">Importe</th>
						<th class="px-5 py-3 text-right">Dateien</th>
						<th class="px-5 py-3 text-right">Speicher</th>
						<th class="px-5 py-3 text-right">Anteil</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.projectStats as p}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3">
								<span class="font-medium text-gray-900">{p.name}</span>
							</td>
							<td class="px-5 py-3 text-right text-gray-600">{p.import_count}</td>
							<td class="px-5 py-3 text-right text-gray-600">{p.file_count}</td>
							<td class="px-5 py-3 text-right text-gray-600">{formatSize(p.total_size)}</td>
							<td class="px-5 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									<div class="w-16 bg-gray-100 rounded-full h-1.5">
										<div class="bg-blue-500 h-1.5 rounded-full"
											style="width: {data.totals.size > 0 ? (p.total_size / data.totals.size * 100).toFixed(0) : 0}%">
										</div>
									</div>
									<span class="text-xs text-gray-400 w-8 text-right">
										{data.totals.size > 0 ? (p.total_size / data.totals.size * 100).toFixed(0) : 0}%
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Nach Kamera Tabelle -->
		<div class="bg-white rounded-lg border border-gray-200">
			<div class="px-5 py-4 border-b border-gray-100">
				<h2 class="font-semibold text-gray-800">Dateien nach Kamera</h2>
			</div>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
						<th class="px-5 py-3 text-left">Kamera</th>
						<th class="px-5 py-3 text-right">Dateien</th>
						<th class="px-5 py-3 text-right">Speicher</th>
						<th class="px-5 py-3 text-right">Anteil</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.byCamera as cam}
						<tr class="hover:bg-gray-50">
							<td class="px-5 py-3 font-medium text-gray-900">{cam.camera}</td>
							<td class="px-5 py-3 text-right text-gray-600">{cam.file_count}</td>
							<td class="px-5 py-3 text-right text-gray-600">{formatSize(cam.total_size)}</td>
							<td class="px-5 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									<div class="w-16 bg-gray-100 rounded-full h-1.5">
										<div class="bg-purple-500 h-1.5 rounded-full"
											style="width: {data.totals.files > 0 ? (cam.file_count / data.totals.files * 100).toFixed(0) : 0}%">
										</div>
									</div>
									<span class="text-xs text-gray-400 w-8 text-right">
										{data.totals.files > 0 ? (cam.file_count / data.totals.files * 100).toFixed(0) : 0}%
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
