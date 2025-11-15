<script>
	import MenuComponent from './MenuComponent.svelte';
	// @ts-ignore
	import { menus } from './MenuList';
</script>

{#each menus as menu}
	<MenuComponent {menu} />
{/each}
