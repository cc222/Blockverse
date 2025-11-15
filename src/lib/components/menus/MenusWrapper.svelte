<script lang="ts">
	import MenuComponent from './MenuComponent.svelte';
	import { MenuManager } from '../../game/Managers/MenuManager.svelte';
	import { onMount } from 'svelte';

	let menuManager: MenuManager;
	onMount(async () => {
		MenuManager.afterInitialization((instance) => {
			menuManager = instance;
		});
	});
</script>

<!-- Renderuj tylko aktywne menu -->
{#if menuManager && menuManager.activeMenu}
	<MenuComponent menu={menuManager.activeMenu} />
{/if}
