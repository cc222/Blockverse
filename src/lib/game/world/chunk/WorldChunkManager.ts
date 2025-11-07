import * as THREE from 'three';
import { ChunkService } from './ChunkService';
import { Chunk } from './chunk';

export class WorldChunkManager {
	private scene: THREE.Scene;
	private seed: number;
	private chunkService: ChunkService;
	private lastPlayerChunkX: number = 0;
	private lastPlayerChunkZ: number = 0;
	private lastPlayerChunkY: number = 0;

	private readonly chunkSize = 16;
	private readonly viewDistance = 4; // liczba chunków w promieniu
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
		const cx = Math.floor(playerPos.x / this.chunkSize);
		const cz = Math.floor(playerPos.z / this.chunkSize);
		const cy = Math.floor(playerPos.y / this.chunkSize);

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

	private async loadChunk(cx: number, cy: number, cz: number) {
		const key = this.getChunkKey(cx, cy, cz);

		// 1️⃣ Pobierz dane voxelowe z generatora / serwisu
		const voxels = await this.chunkService.generateChunk(cx, cy, cz, this.seed);
		const chunk = new Chunk(this.scene, this.seed, cx, cy, cz);
		chunk.voxels = new Uint8Array(voxels);
		chunk.buildMesh();
		this.chunks.set(key, chunk);
	}

	private unloadChunk(key: string) {
		const chunk = this.chunks.get(key);
		if (!chunk) return;
		chunk.dispose();
		this.chunks.delete(key);
	}

	disposeAll() {
		for (const chunk of this.chunks.values()) {
			chunk.dispose();
		}
		this.chunks.clear();
	}
}
