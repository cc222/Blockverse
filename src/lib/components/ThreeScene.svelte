<script lang="ts">
	import { FPSControls } from '$lib/game/controls';
	import { createWorld } from '$lib/game/world/world';
	import { onMount, onDestroy } from 'svelte';
	import Stats from 'stats.js';

	let canvas: HTMLCanvasElement;
	let terrainDispose: (() => void) | null = null;
	let controls: FPSControls;
	let stats: Stats;

	onMount(() => {
		const { scene, camera, renderer } = createWorld(canvas);
		controls = new FPSControls(camera, renderer.domElement);
		stats = new Stats();
		stats.showPanel(0); // 0 = FPS
		document.body.appendChild(stats.dom);
		stats.dom.style.position = 'fixed';
		stats.dom.style.left = '0';
		stats.dom.style.top = '0';
		stats.dom.style.zIndex = '9999';

		// if (terrain && typeof terrain.dispose === 'function') {
		// 	terrainDispose = () => terrain.dispose();
		// }

		let prevTime = performance.now();

		function animate() {
			requestAnimationFrame(animate);
			const time = performance.now();
			const delta = (time - prevTime) / 1000;
			prevTime = time;

			stats.begin();
			controls.update(delta);
			renderer.render(scene, camera);
			stats.end();
		}
		animate();

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		return () => {
			// cleanup (svelte onDestroy also called)
			//terrainDispose && terrainDispose();
			renderer.dispose();
		};
	});

	onDestroy(() => {
		//terrainDispose && terrainDispose();
	});
</script>

<canvas bind:this={canvas} class="fixed top-0 left-0 h-full w-full"></canvas>

<style>
	canvas {
		display: block;
		cursor: crosshair;
	}
</style>
