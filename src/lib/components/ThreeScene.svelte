<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { GameManager } from '$lib/game/GameManger';

	let gameCanvas: HTMLCanvasElement;
	let dispose: (() => void) | null = null;

	onMount(() => {
		(async () => {
			console.log('Initializing game...');
			dispose = await GameManager.initialize(gameCanvas);
		})();
		return () => {
			dispose?.();
		};
	});

	onDestroy(() => {
		dispose?.();
	});
</script>

<canvas bind:this={gameCanvas} class="fixed top-0 left-0 h-full w-full"></canvas>

<style>
	canvas {
		display: block;
		cursor: crosshair;
	}
</style>
