<script lang="ts">
	import MenuComponent from './MenuComponent.svelte';
	import { MenuManager } from '../../game/Managers/MenuManager.svelte';
	import { onMount } from 'svelte';

	let {
		menuManager
	}: {
		menuManager: MenuManager;
	} = $props();
</script>

<!-- Renderuj tylko aktywne menu -->
{#if menuManager && menuManager.activeMenu}
	<MenuComponent menu={menuManager.activeMenu} />
{/if}
