// src/game/world.ts
import * as THREE from 'three';
import { generateTerrainInstanced } from './terrain';

export function createWorld(canvas: HTMLCanvasElement) {
	const scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x202025, 0.02);
	scene.background = new THREE.Color(0x87ceeb);

	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 10, 20);

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
	hemi.position.set(0, 50, 0);
	scene.add(hemi);

	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(-10, 40, 10);
	dir.castShadow = true;
	dir.shadow.mapSize.width = 2048;
	dir.shadow.mapSize.height = 2048;
	dir.shadow.camera.left = -50;
	dir.shadow.camera.right = 50;
	dir.shadow.camera.top = 50;
	dir.shadow.camera.bottom = -50;
	scene.add(dir);

	// generate terrain
	const terrain = generateTerrainInstanced(scene, {
		width: 80, // blocks X
		depth: 80, // blocks Z
		maxHeight: 24,
		scale: 50,
		seed: Math.floor(Math.random() * 10000),
		blockSize: 1,
		waterLevel: 6,
		caveThreshold: 0.58
	});

	// small helper grid (optional)
	const grid = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
	grid.material.opacity = 0.08;
	grid.material.transparent = true;
	scene.add(grid);

	// resize handling
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	return { scene, camera, renderer, terrain };
}
