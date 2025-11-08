import * as THREE from 'three';
import { ChunkService } from './ChunkService';
import { Chunk } from './Chunk';
import { CHUNK_SIZE, HALO } from '$lib/game/GameConts';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import type { MeshData } from './MeshData';
type Job = { key: string; chunk: Chunk; token: number; priority: number };
export class WorldChunkManager {
	private scene: THREE.Scene;
	private seed: number;
	private chunkService: ChunkService;

	private lastPlayerChunkX: number = 0;
	private lastPlayerChunkZ: number = 0;
	private lastPlayerChunkY: number = 0;

	private readonly viewDistance = 10; // liczba chunków w promieniu
	private chunks = new Map<string, Chunk>();

	private queue: Job[] = [];
	private queued = new Set<string>();
	private inFlight = new Set<string>();
	private readonly REMESH_BUDGET = 2;

	private _pumpScheduled = false;
	private playerPos = new THREE.Vector3();

	private solidMat = new THREE.MeshStandardMaterial({
		color: 0x808080,
		flatShading: true,
		map: textureAtlas.texture
	});
	private transpMat = new THREE.MeshStandardMaterial({
		color: 0x80c0ff,
		transparent: true,
		opacity: 0.6,
		flatShading: true,
		map: textureAtlas.texture
	});

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
		this.playerPos.copy(playerPos);
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

	enqueueRemesh(chunk: Chunk, token: number) {
		const key = this.getChunkKey(chunk.cx, chunk.cy, chunk.cz);
		if (this.inFlight.has(key)) return;

		if (!this.queued.has(key)) {
			this.queued.add(key);
			this.queue.push({ key, chunk, token, priority: this.priorityFor(chunk) });
		} else {
			// odśwież istniejący wpis (token + priority)
			for (let i = 0; i < this.queue.length; i++) {
				if (this.queue[i].key === key) {
					this.queue[i].token = token;
					this.queue[i].priority = this.priorityFor(chunk);
					break;
				}
			}
		}
		this.schedulePump();
	}

	private pumpQueue() {
		this.queue.sort((a, b) => a.priority - b.priority);

		let budget = this.REMESH_BUDGET;
		while (budget > 0 && this.queue.length) {
			const job = this.queue.shift()!;
			console.log('rendering poitiry: ', job.priority);
			const { key, token, chunk } = job;
			this.queued.delete(key);

			// jeśli w mapie nie ma już TEGO samego obiektu, porzuć joba
			const current = this.chunks.get(key);
			if (!current || current !== chunk) {
				continue;
			}
			if (this.inFlight.has(key)) continue;

			this.inFlight.add(key);

			chunk
				.buildMeshData()
				.then(({ solid, transparent }: { solid: MeshData; transparent: MeshData }) => {
					if (token !== chunk.currentToken()) return; // DROP przestarzałe

					const meshes: THREE.Mesh[] = [];
					const mk = (data: MeshData, material: THREE.Material) => {
						if (!data || data.positions.length === 0) return;
						const g = new THREE.BufferGeometry();
						g.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
						g.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
						g.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
						g.setIndex(new THREE.Uint32BufferAttribute(data.indices, 1));

						const m = new THREE.Mesh(g, material);
						m.castShadow = true;
						m.receiveShadow = true;
						meshes.push(m);
					};

					mk(solid, this.solidMat);
					mk(transparent, this.transpMat);

					chunk.applyMesh(meshes);
				})
				.finally(() => {
					this.inFlight.delete(key);
					if (this.queue.length) this.schedulePump();
				});

			budget--;
		}
	}

	private priorityFor(c: Chunk): number {
		const center = new THREE.Vector3(
			c.cx * CHUNK_SIZE + CHUNK_SIZE * 0.5,
			c.cy * CHUNK_SIZE + CHUNK_SIZE * 0.5,
			c.cz * CHUNK_SIZE + CHUNK_SIZE * 0.5
		);
		const d2 = center.distanceToSquared(this.playerPos);
		// preferuj chunki bez mesha (pierwszy render) – mniejsza priority-wartość = wcześniej
		const firstRenderBonus = c.meshes ? 1000 : 0;
		return d2 + firstRenderBonus;
	}

	private schedulePump() {
		if (this._pumpScheduled) return;
		this._pumpScheduled = true;
		requestAnimationFrame(() => {
			this._pumpScheduled = false;
			this.pumpQueue();
		});
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
			if (neighborChunk) requestAnimationFrame(() => neighborChunk.requestRemesh());
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
		this.queue = [];
		this.queued.clear();
		this.inFlight.clear();
	}
}
