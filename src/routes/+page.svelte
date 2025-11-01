<script lang="ts">
	import ThreeScene from '$lib/components/ThreeScene.svelte';
</script>

<main>
	<ThreeScene />
	<div class="hud">🎮 Sterowanie: W A S D</div>
</main>

<style>
	.hud {
		position: absolute;
		top: 1rem;
		left: 1rem;
		color: white;
		font-family: sans-serif;
	}
</style>
