// src/game/chunk.ts
import * as THREE from 'three';
import { TerrainGenerator } from './terrain';
import { Mesher } from './mesher';

export const CHUNK_SIZE = 16;

export class Chunk {
	cx: number;
	cy: number;
	cz: number;
	voxels: Uint8Array;
	meshGroup?: { meshes: THREE.Mesh[]; dispose: () => void };
	scene: THREE.Scene;
	generator: TerrainGenerator;

	constructor(scene: THREE.Scene, generator: TerrainGenerator, cx: number, cy: number, cz: number) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.scene = scene;
		this.generator = generator;
		this.voxels = new Uint8Array(CHUNK_SIZE ** 3);
	}

	index(x: number, y: number, z: number): number {
		return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
	}

	generate(): void {
		const baseX = this.cx * CHUNK_SIZE;
		const baseY = this.cy * CHUNK_SIZE;
		const baseZ = this.cz * CHUNK_SIZE;

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const wx = baseX + x;
					const wy = baseY + y;
					const wz = baseZ + z;
					const id = this.generator.sample(wx, wy, wz);
					this.voxels[this.index(x, y, z)] = id;
				}
			}
		}
	}

	buildMesh(): void {
		if (this.meshGroup) this.meshGroup.dispose();
		this.meshGroup = Mesher.build(
			this.scene,
			this.voxels,
			CHUNK_SIZE,
			CHUNK_SIZE,
			CHUNK_SIZE,
			this.cx,
			this.cy,
			this.cz
		);
	}

	dispose(): void {
		if (this.meshGroup) {
			this.meshGroup.dispose();
			this.meshGroup = undefined;
		}
	}
}

export class WorldChunkManager {
	scene: THREE.Scene;
	generator: TerrainGenerator;
	chunks = new Map<string, Chunk>();
	renderDistance = 4;

	constructor(scene: THREE.Scene, generator: TerrainGenerator) {
		this.scene = scene;
		this.generator = generator;
	}

	key(cx: number, cy: number, cz: number): string {
		return `${cx},${cy},${cz}`;
	}

	getOrCreate(cx: number, cy: number, cz: number): Chunk {
		const key = this.key(cx, cy, cz);
		let chunk = this.chunks.get(key);
		if (!chunk) {
			chunk = new Chunk(this.scene, this.generator, cx, cy, cz);
			chunk.generate();
			chunk.buildMesh();
			this.chunks.set(key, chunk);
		}
		return chunk;
	}

	update(playerPos: THREE.Vector3) {
		const cx = Math.floor(playerPos.x / CHUNK_SIZE);
		const cy = Math.floor(playerPos.y / CHUNK_SIZE);
		const cz = Math.floor(playerPos.z / CHUNK_SIZE);

		const needed = new Set<string>();

		for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
			for (let y = -this.renderDistance; y <= this.renderDistance; y++) {
				for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
					const key = this.key(cx + x, cy + y, cz + z);
					needed.add(key);
					if (!this.chunks.has(key)) {
						const c = new Chunk(this.scene, this.generator, cx + x, cy + y, cz + z);
						c.generate();
						c.buildMesh();
						this.chunks.set(key, c);
					}
				}
			}
		}

		// usuń chunki spoza zasięgu
		for (const [key, chunk] of this.chunks) {
			if (!needed.has(key)) {
				chunk.dispose();
				this.chunks.delete(key);
			}
		}
	}
}
