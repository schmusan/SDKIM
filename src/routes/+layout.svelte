<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';

	let { children } = $props();

	const navItems = [
		{
			href: '/',
			label: 'Dashboard',
			icon: 'M3 5a2 2 0 0 1 2-2h4v8H3zM3 13h6v8H5a2 2 0 0 1-2-2zM11 3h4a2 2 0 0 1 2 2v6h-6zM11 13h6v6a2 2 0 0 1-2 2h-4zM19 3h2a2 2 0 0 1 2 2v6h-4zM19 13h4v6a2 2 0 0 1-2 2h-2z'
		},
		{
			href: '/import',
			label: 'Import',
			icon: 'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14'
		},
		{
			href: '/projects',
			label: 'Projekte',
			icon: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
		},
		{
			href: '/sd-cards',
			label: 'SD-Karten',
			icon: 'M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7v3M12 7v3M15 7v3'
		},
		{
			href: '/cameras',
			label: 'Kameras',
			icon: 'M3 7a2 2 0 0 1 2-2h2.5l1.2-1.7A2 2 0 0 1 10.4 2.5h3.2c.6 0 1.2.3 1.6.8L16.5 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 16.6A3.6 3.6 0 1 0 12 9.4a3.6 3.6 0 0 0 0 7.2z'
		},
		{
			href: '/statistics',
			label: 'Statistiken',
			icon: 'M3 17l6-6 4 4 8-8m0 0v6m0-6h-6'
		},
		{
			href: '/settings',
			label: 'Einstellungen',
			icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'
		}
	];

	function isActive(href: string) {
		return href === '/'
			? $page.url.pathname === '/'
			: $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex h-screen text-[color:var(--color-ink-900)]" style="background:var(--color-canvas)">
	<aside class="w-60 flex flex-col px-4 py-5 border-r" style="border-color:var(--color-stroke); background:rgba(255,255,255,0.6); backdrop-filter:saturate(180%) blur(16px);">
		<a href="/" class="flex items-center gap-2.5 px-2 mb-7">
			<img src="/logo.svg" alt="SDKIM" class="w-8 h-8" />
			<div class="leading-tight">
				<p class="text-[15px] font-semibold tracking-tight" style="color:var(--color-ink-900)">SDKIM</p>
				<p class="text-[11px]" style="color:var(--color-ink-400)">SD-Karten Import</p>
			</div>
		</a>

		<nav class="flex-1 space-y-0.5">
			{#each navItems as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					class="group flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-150"
					style={active
						? 'background:var(--color-brand-500); color:#fff;'
						: 'color:var(--color-ink-600);'}
					onmouseenter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
					onmouseleave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = ''; }}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] shrink-0">
						<path d={item.icon} />
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="pt-3 mt-3 border-t" style="border-color:var(--color-stroke)">
			<p class="text-[10.5px] uppercase tracking-[0.08em] font-semibold px-3" style="color:var(--color-ink-400)">v 1.0 · Prototyp</p>
		</div>
	</aside>

	<main class="flex-1 overflow-auto">
		<div class="max-w-[1400px] mx-auto px-10 py-10">
			{@render children()}
		</div>
	</main>
</div>
