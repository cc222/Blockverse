<script lang="ts">
	import MenuComponent from './MenuComponent.svelte';
	import { MenuManager } from './MenuManager.svelte';

	const menuManager = MenuManager.instance;
</script>

<!-- Renderuj tylko aktywne menu -->
{#if menuManager.activeMenu}
	<MenuComponent menu={menuManager.activeMenu} />
{/if}
