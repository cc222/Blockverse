// src/game/terrain.ts
import * as THREE from 'three';
import { Perlin } from './perlin';

export type BlockType = 'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'water';

export interface TerrainOptions {
	width: number; // liczba bloków w osi X
	depth: number; // liczba bloków w osi Z
	maxHeight: number; // maksymalna wysokość w blokach
	scale?: number; // skalowanie perlin noise
	seed?: number;
	blockSize?: number;
	waterLevel?: number;
	caveThreshold?: number; // 0..1, mniejsza -> więcej jaskiń
}

export function generateTerrainInstanced(scene: THREE.Scene, options: TerrainOptions) {
	const {
		width,
		depth,
		maxHeight,
		scale = 30,
		seed = 0,
		blockSize = 1,
		waterLevel = Math.floor(maxHeight * 0.3),
		caveThreshold = 0.55
	} = options;

	const perlin = new Perlin(seed);

	// Prepare materials for different block types (simple colors)
	const matGrass = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
	const matDirt = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
	const matStone = new THREE.MeshStandardMaterial({ color: 0x888888 });
	const matSand = new THREE.MeshStandardMaterial({ color: 0xf4e7a1 });
	const matWater = new THREE.MeshStandardMaterial({
		color: 0x3ea6ff,
		transparent: true,
		opacity: 0.6
	});

	// We'll create separate InstancedMesh per material (keeps GPU state clean)
	const boxGeo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

	const instancedMap: Record<string, THREE.InstancedMesh> = {};
	const mats = {
		grass: matGrass,
		dirt: matDirt,
		stone: matStone,
		sand: matSand,
		water: matWater
	};

	// pre-alloc arrays storing transforms for each type
	const transforms: Record<string, THREE.Matrix4[]> = {
		grass: [],
		dirt: [],
		stone: [],
		sand: [],
		water: []
	};

	// Generate heightmap + caves
	function heightAt(x: number, z: number) {
		// Combine octaves of Perlin for better terrain
		let n = 0;
		let amp = 1;
		let freq = 1;
		let max = 0;
		for (let o = 0; o < 5; o++) {
			n += perlin.noise((x / scale) * freq, (z / scale) * freq) * amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}
		n /= max;
		// stretch and map to [0, maxHeight]
		return Math.floor(n * maxHeight);
	}

	function caveAt(x: number, y: number, z: number) {
		// 3D noise for caves
		let n = 0;
		let amp = 1;
		let freq = 1;
		let max = 0;
		for (let o = 0; o < 3; o++) {
			n +=
				perlin.noise((x / (scale / 2)) * freq, (y / (scale / 2)) * freq, (z / (scale / 2)) * freq) *
				amp;
			max += amp;
			amp *= 0.5;
			freq *= 2;
		}
		n /= max;
		return n;
	}

	// iterate grid
	for (let ix = 0; ix < width; ix++) {
		for (let iz = 0; iz < depth; iz++) {
			const hx = heightAt(ix, iz);

			// create column from 0..hx
			for (let y = 0; y <= hx; y++) {
				// apply cave cutout
				const caveVal = caveAt(ix, y, iz);
				if (caveVal > caveThreshold) continue; // carve cave

				let type: BlockType = 'dirt';
				if (y === hx) {
					// topmost block
					type = y <= waterLevel - 1 ? 'sand' : 'grass';
				} else if (y > hx - 4) {
					type = 'dirt';
				} else {
					type = 'stone';
				}

				// If below water level, fill with water above blocks as water instanced
				const worldX = (ix - width / 2) * blockSize;
				const worldZ = (iz - depth / 2) * blockSize;
				const worldY = y * blockSize + blockSize / 2;

				const m = new THREE.Matrix4().makeTranslation(worldX, worldY, worldZ);
				if (type === 'grass') transforms.grass.push(m);
				else if (type === 'dirt') transforms.dirt.push(m);
				else if (type === 'stone') transforms.stone.push(m);
				else if (type === 'sand') transforms.sand.push(m);
			}

			// water plane: create water blocks up to waterLevel if hx < waterLevel
			for (let y = hx + 1; y <= waterLevel; y++) {
				const worldX = (ix - width / 2) * blockSize;
				const worldZ = (iz - depth / 2) * blockSize;
				const worldY = y * blockSize + blockSize / 2;
				const m = new THREE.Matrix4().makeTranslation(worldX, worldY, worldZ);
				transforms.water.push(m);
			}
		}
	}

	// Create InstancedMesh for each type with at least number of instances required
	Object.keys(transforms).forEach((key) => {
		const arr = transforms[key];
		if (arr.length === 0) return;
		const material = (mats as Record<string, THREE.Material>)[key];
		const inst = new THREE.InstancedMesh(boxGeo, material, arr.length);
		inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		for (let i = 0; i < arr.length; i++) {
			inst.setMatrixAt(i, arr[i]);
		}
		// optional: cast/receive shadows
		inst.castShadow = key !== 'water';
		inst.receiveShadow = true;
		scene.add(inst);
		(instancedMap as Record<string, THREE.InstancedMesh>)[key] = inst;
	});

	// Return helper to dispose later
	return {
		instancedMap,
		dispose() {
			Object.values(instancedMap).forEach((inst) => {
				inst.geometry.dispose();
				if (Array.isArray(inst.material)) {
					inst.material.forEach((m) => m.dispose());
				} else {
					inst.material.dispose();
				}
				scene.remove(inst);
			});
		}
	};
}
