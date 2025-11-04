// src/game/chunk.ts
import { WorldSettings } from '$lib/game/settings/world';
import * as THREE from 'three';
import { Mesher } from '../mesher';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import type { ChunkService } from './ChunkService';

export const CHUNK_SIZE = WorldSettings.CHUNK_SIZE;

export class Chunk {
	//TODO: add cashed borders voxels for meshing optimization
	cx: number;
	cy: number;
	cz: number;
	voxels: Uint8Array;
	meshGroup?: { meshes: THREE.Mesh[]; dispose: () => void };
	scene: THREE.Scene;
	seed: number;
	chunkService?: ChunkService;

	constructor(
		scene: THREE.Scene,
		seed: number,
		cx: number,
		cy: number,
		cz: number,
		chunkService: ChunkService
	) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.scene = scene;
		this.seed = seed;
		this.voxels = new Uint8Array(CHUNK_SIZE ** 3);
		this.chunkService = chunkService;
	}

	index(x: number, y: number, z: number): number {
		return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
	}

	async generate(): Promise<void> {
		if (!this.chunkService) {
			throw new Error('ChunkService is not provided for chunk generation.');
		}
		this.voxels = await this.chunkService.generateChunk(this.cx, this.cy, this.cz, this.seed);
		// const baseX = this.cx * CHUNK_SIZE;
		// const baseY = this.cy * CHUNK_SIZE;
		// const baseZ = this.cz * CHUNK_SIZE;

		// for (let x = 0; x < CHUNK_SIZE; x++) {
		// 	for (let y = 0; y < CHUNK_SIZE; y++) {
		// 		for (let z = 0; z < CHUNK_SIZE; z++) {
		// 			const wx = baseX + x;
		// 			const wy = baseY + y;
		// 			const wz = baseZ + z;
		// 			const id = this.generator.sample(wx, wy, wz);
		// 			this.voxels[this.index(x, y, z)] = id;
		// 		}
		// 	}
		// }
	}

	buildMesh(): void {
		//console.log(textureAtlas);
		if (this.meshGroup) this.meshGroup.dispose();
		this.meshGroup = Mesher.build(
			this.scene,
			this.voxels,
			CHUNK_SIZE,
			CHUNK_SIZE,
			CHUNK_SIZE,
			this.cx,
			this.cy,
			this.cz,
			textureAtlas
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
	seed: number;
	chunkService: ChunkService;
	chunks = new Map<string, Chunk>();
	renderDistance = 3;

	constructor(scene: THREE.Scene, seed: number, chunkService: ChunkService) {
		this.scene = scene;
		this.seed = seed;
		this.chunkService = chunkService;
	}

	key(cx: number, cy: number, cz: number): string {
		return `${cx},${cy},${cz}`;
	}

	async getOrCreate(cx: number, cy: number, cz: number): Promise<Chunk> {
		const key = this.key(cx, cy, cz);
		let chunk = this.chunks.get(key);
		if (!chunk) {
			chunk = new Chunk(this.scene, this.seed, cx, cy, cz, this.chunkService);
			await chunk.generate();
			await chunk.buildMesh();
			this.chunks.set(key, chunk);
		}
		return chunk;
	}

	async update(playerPos: THREE.Vector3) {
		const cx = Math.floor(playerPos.x / CHUNK_SIZE);
		const cy = Math.floor(playerPos.y / CHUNK_SIZE);
		const cz = Math.floor(playerPos.z / CHUNK_SIZE);
		//console.log('player biome' + this.generator.getBiomeAt(playerPos.x, playerPos.z).type);

		const needed = new Set<string>();
		const newChunks: Promise<void>[] = [];

		for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
			for (let y = -this.renderDistance; y <= this.renderDistance; y++) {
				for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
					const key = this.key(cx + x, cy + y, cz + z);
					needed.add(key);

					if (!this.chunks.has(key)) {
						const c = new Chunk(this.scene, this.seed, cx + x, cy + y, cz + z, this.chunkService);
						this.chunks.set(key, c);

						// Generuj asynchronicznie w tle
						const task = c.generate().then(() => {
							c.buildMesh();
						});

						newChunks.push(task);
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
		// Nie blokuj głównego wątku – generacja dzieje się w tle
		await Promise.allSettled(newChunks);
	}
}
