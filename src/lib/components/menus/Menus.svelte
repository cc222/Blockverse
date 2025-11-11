<script>
	import MenuComponent from './MenuComponent.svelte';
	import { menus } from './MenuList';
</script>

{#each menus as menu}
	<MenuComponent {menu} />
{/each}
