<script lang="ts">
	interface Props {
		text: string;
		side?: 'top' | 'bottom';
		width?: string;
	}

	let { text, side = 'top', width = 'w-64' }: Props = $props();
	let open = $state(false);
	let pinned = $state(false);

	function toggle() {
		pinned = !pinned;
		open = pinned;
	}
	function enter() {
		if (!pinned) open = true;
	}
	function leave() {
		if (!pinned) open = false;
	}
</script>

<span class="relative inline-flex">
	<button
		type="button"
		onmouseenter={enter}
		onmouseleave={leave}
		onclick={toggle}
		onfocus={enter}
		onblur={() => { if (!pinned) open = false; }}
		class="text-gray-400 hover:text-blue-600 cursor-pointer text-sm leading-none transition-colors"
		aria-label="Hilfetext anzeigen"
		aria-expanded={open}
	>ⓘ</button>
	{#if open}
		<span
			role="tooltip"
			class="absolute z-50 left-1/2 -translate-x-1/2 {side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} {width} bg-gray-900 text-white text-xs leading-relaxed font-normal rounded-md px-3 py-2 shadow-lg whitespace-normal"
		>
			{text}
			<span
				class="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 {side === 'top' ? '-bottom-1' : '-top-1'}"
			></span>
		</span>
	{/if}
</span>
