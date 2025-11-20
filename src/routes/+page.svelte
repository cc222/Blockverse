<script lang="ts">
	import Chat from '$lib/components/Chat.svelte';
	import MenusWrapper from '$lib/components/menus/MenusWrapper.svelte';
	import MainMenu from '$lib/components/test/MainMenu.svelte';
	import { GameState, MainManager } from '$lib/game/Managers/MainManager.svelte';
	import { MainMenuManager } from '$lib/game/Managers/MainMenuManager.svelte';
	import { onDestroy, onMount } from 'svelte';

	let gameCanvas: HTMLCanvasElement;
	let mainManager: MainManager | undefined = $state(undefined);
	let isEnabled = $state(false);

	onMount(() => {
		console.log('Initializing game...');
		mainManager = MainManager.createInstance(gameCanvas);
		isEnabled = true;
		return () => {
			MainManager.destroy();
		};
	});

	onDestroy(() => {
		MainManager.destroy();
	});
</script>

<main>
	<canvas bind:this={gameCanvas} class="fixed top-0 left-0 h-full w-full"></canvas>
	{#if isEnabled && mainManager}
		{#if mainManager?.gameState === GameState.MAIN_MENU}
			<MainMenu />
		{/if}
		{#if mainManager?.gameState === GameState.IN_GAME}
			<MenusWrapper menuManager={mainManager.menuManager} />
			<Chat chatManager={mainManager.gameManager!.chatManager} />
		{/if}
	{/if}
</main>

<style>
	canvas {
		display: block;
	}
</style>
