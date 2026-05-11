<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '⊞' },
		{ href: '/import', label: 'Import', icon: '↓' },
		{ href: '/projects', label: 'Projekte', icon: '▤' },
		{ href: '/sd-cards', label: 'SD-Karten', icon: '▪' },
		{ href: '/cameras', label: 'Kamera-Profile', icon: '◎' },
		{ href: '/statistics', label: 'Statistiken', icon: '↗' },
		{ href: '/settings', label: 'Einstellungen', icon: '⚙' }
	];

	function isActive(href: string) {
		return href === '/'
			? $page.url.pathname === '/'
			: $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen bg-gray-100">
	<aside class="w-56 bg-gray-900 text-white flex flex-col">
		<div class="px-6 py-5 border-b border-gray-700">
			<span class="text-lg font-bold tracking-tight">SDKIM</span>
			<p class="text-xs text-gray-400 mt-0.5">SD-Karten Import</p>
		</div>
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
						{isActive(item.href)
						? 'bg-blue-600 text-white'
						: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
				>
					<span class="text-base">{item.icon}</span>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>

	<main class="flex-1 overflow-auto p-8">
		{@render children()}
	</main>
</div>
