// src/game/world.ts
import * as THREE from 'three';
import { TerrainGenerator } from './terrain';
import { Mesher } from './mesher';

export function createWorld(canvas: HTMLCanvasElement) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87ceeb);
	scene.fog = new THREE.FogExp2(0x202020, 0.02);

	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 20, 30);

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;

	const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
	scene.add(hemi);

	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(-20, 40, 20);
	dir.castShadow = true;
	scene.add(dir);

	// 🚀 Generate terrain data
	const terrain = new TerrainGenerator({
		width: 800,
		depth: 800,
		height: 100,
		seed: Math.random() * 10000,
		waterLevel: 6,
		caveThreshold: 0.58
	});

	const voxels = terrain.generate();

	// 🧱 Build mesh
	const meshGroup = Mesher.build(scene, voxels, terrain.width, terrain.height, terrain.depth);

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	return { scene, camera, renderer, terrain, meshGroup };
}
