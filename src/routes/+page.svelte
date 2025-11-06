<script lang="ts">
	import Menu from '$lib/components/menus/MenuComponent.svelte';
	import { PauseMenu } from '$lib/components/menus/PauseMenu';
	import ThreeScene from '$lib/components/ThreeScene.svelte';
</script>

<main>
	<ThreeScene />
	<Menu menu={PauseMenu.instance} />
</main>

<style>
	/* .hud {
		position: absolute;
		top: 1rem;
		left: 1rem;
		color: white;
		font-family: sans-serif;
	} */
</style>
