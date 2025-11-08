import * as THREE from 'three';
import { ChunkService } from './ChunkService';
import { Chunk } from './Chunk';
import { CHUNK_SIZE, HALO } from '$lib/game/GameConts';

export class WorldChunkManager {
	private scene: THREE.Scene;
	private seed: number;
	private chunkService: ChunkService;
	private lastPlayerChunkX: number = 0;
	private lastPlayerChunkZ: number = 0;
	private lastPlayerChunkY: number = 0;

	private readonly viewDistance = 10; // liczba chunków w promieniu
	private chunks = new Map<string, Chunk>();

	constructor(scene: THREE.Scene, seed: number, chunkService: ChunkService) {
		this.scene = scene;
		this.seed = seed;
		this.chunkService = chunkService;
	}

	getChunkKey(cx: number, cy: number, cz: number): string {
		return `${cx},${cy},${cz}`;
	}

	/**
	 * Główny update — sprawdza, które chunki powinny być widoczne
	 */
	update(playerPos: THREE.Vector3) {
		const cx = Math.floor(playerPos.x / CHUNK_SIZE);
		const cz = Math.floor(playerPos.z / CHUNK_SIZE);
		const cy = Math.floor(playerPos.y / CHUNK_SIZE);

		if (
			this.lastPlayerChunkX === cx &&
			this.lastPlayerChunkZ === cz &&
			this.lastPlayerChunkY === cy
		) {
			return; // brak zmiany chunku
		} else {
			const needed = new Set<string>();
			for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
				for (let y = -this.viewDistance; y <= this.viewDistance; y++) {
					for (let z = -this.viewDistance; z <= this.viewDistance; z++) {
						const key = this.getChunkKey(cx + x, cy + y, cz + z);
						needed.add(key);
						if (!this.chunks.has(key)) {
							this.loadChunk(cx + x, cy + y, cz + z);
						}
					}
				}
			}
			// usuń chunki poza zasięgiem
			for (const key of this.chunks.keys()) {
				if (!needed.has(key)) {
					this.unloadChunk(key);
				}
			}
		}
		this.lastPlayerChunkX = cx;
		this.lastPlayerChunkZ = cz;
		this.lastPlayerChunkY = cy;
	}

	getHaloVoxels(cx: number, cy: number, cz: number): Uint8Array {
		const sizeWithHalo = CHUNK_SIZE + 2 * HALO;
		const haloVoxels = new Uint8Array(sizeWithHalo ** 3);

		const getVoxel = (x: number, y: number, z: number) => {
			const chunkX = Math.floor(x / CHUNK_SIZE);
			const chunkY = Math.floor(y / CHUNK_SIZE);
			const chunkZ = Math.floor(z / CHUNK_SIZE);

			const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
			const localY = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
			const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

			const neighborKey = this.getChunkKey(chunkX, chunkY, chunkZ);
			const neighborChunk = this.chunks.get(neighborKey);

			if (!neighborChunk) return 0; // air jeśli brak sąsiada
			return neighborChunk.voxels[localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE];
		};

		for (let x = -HALO; x < CHUNK_SIZE + HALO; x++) {
			for (let y = -HALO; y < CHUNK_SIZE + HALO; y++) {
				for (let z = -HALO; z < CHUNK_SIZE + HALO; z++) {
					const vx = x + HALO;
					const vy = y + HALO;
					const vz = z + HALO;

					haloVoxels[vx + vy * sizeWithHalo + vz * sizeWithHalo * sizeWithHalo] = getVoxel(
						cx * CHUNK_SIZE + x,
						cy * CHUNK_SIZE + y,
						cz * CHUNK_SIZE + z
					);
				}
			}
		}

		return haloVoxels;
	}
	neighborDirs = [
		[-1, 0, 0],
		[1, 0, 0],
		[0, -1, 0],
		[0, 1, 0],
		[0, 0, -1],
		[0, 0, 1]
	];
	private async loadChunk(cx: number, cy: number, cz: number) {
		const key = this.getChunkKey(cx, cy, cz);

		// 1️⃣ Pobierz dane voxelowe z generatora / serwisu
		const voxels = await this.chunkService.generateChunk(cx, cy, cz, this.seed);
		const chunk = new Chunk(this.scene, this.seed, cx, cy, cz);
		chunk.voxels = new Uint8Array(voxels);
		this.chunks.set(key, chunk);
		chunk.requestRemesh();
		this.remeshNeighbors(cx, cy, cz);
	}

	private remeshNeighbors(cx: number, cy: number, cz: number) {
		for (const [dx, dy, dz] of this.neighborDirs) {
			const neighborKey = this.getChunkKey(cx + dx, cy + dy, cz + dz);
			const neighborChunk = this.chunks.get(neighborKey);
			if (neighborChunk) neighborChunk.requestRemesh();
		}
	}

	private unloadChunk(key: string) {
		const chunk = this.chunks.get(key);
		if (!chunk) return;
		chunk.unload();
		this.chunks.delete(key);
		this.remeshNeighbors(chunk.cx, chunk.cy, chunk.cz);
	}

	disposeAll() {
		for (const chunk of this.chunks.values()) {
			chunk.unload();
		}
		this.chunks.clear();
	}
}
