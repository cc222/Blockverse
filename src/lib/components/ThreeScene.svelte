<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { GameManager } from '$lib/game/GameManger';
	import { MainManager } from '$lib/game/Managers/MainManager';

	let gameCanvas: HTMLCanvasElement;
	let dispose: (() => void) | null = null;

	onMount(() => {
		(async () => {
			console.log('Initializing game...');
			await MainManager.getInstance(gameCanvas);
		})();
		return () => {
			MainManager.destroy();
		};
	});

	onDestroy(() => {
		MainManager.destroy();
	});
</script>

<canvas bind:this={gameCanvas} class="fixed top-0 left-0 h-full w-full"></canvas>

<style>
	canvas {
		display: block;
		cursor: crosshair;
	}
</style>
