// src/game/world.ts
import * as THREE from 'three';
import { WorldChunkManager } from './chunk/chunk';
import { ChunkService } from './chunk/ChunkService';

export function createWorld(canvas: HTMLCanvasElement) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87ceeb);
	scene.fog = new THREE.FogExp2(0x202020, 0.02);

	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 30, 0);

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;

	const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
	scene.add(hemi);

	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(-20, 40, 20);
	dir.castShadow = true;
	scene.add(dir);

	// 🌍 generator i menedżer chunków
	const seed = Math.random() * 10000;
	const chunkService = new ChunkService();
	const chunks = new WorldChunkManager(scene, seed, chunkService);

	function animate() {
		requestAnimationFrame(animate);
		chunks.update(camera.position);
		renderer.render(scene, camera);
	}

	animate();

	return { scene, camera, renderer, chunks };
}
