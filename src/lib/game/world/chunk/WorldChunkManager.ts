import * as THREE from 'three';
import { ChunkService } from './ChunkService';
import { Chunk } from './Chunk';
import { CHUNK_SIZE, HALO } from '$lib/game/GameConts';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import type { MeshData } from './MeshData';
import { Debug } from '$lib/debug/Debug';
import { DebugLevel } from '$lib/debug/DebugLevel';
import { DebugType } from '$lib/debug/DebugType';
type Job = { key: string; chunk: Chunk; token: number; priority: number };
export class WorldChunkManager {
	private scene: THREE.Scene;
	private seed: number;
	private chunkService: ChunkService;

	private lastPlayerChunkX: number = 0;
	private lastPlayerChunkZ: number = 0;
	private lastPlayerChunkY: number = 0;

	private readonly viewDistance = 10; // liczba chunków w promieniu
	private readonly viewDistSq = this.viewDistance * this.viewDistance;
	private chunks = new Map<string, Chunk>();

	private queue: Job[] = [];
	private queued = new Set<string>();
	private inFlight = new Set<string>();
	private loadingChunks = new Set<string>();
	private readonly REMESH_BUDGET = 10;

	private static readonly neighborDirs = [
		[-1, 0, 0],
		[1, 0, 0],
		[0, -1, 0],
		[0, 1, 0],
		[0, 0, -1],
		[0, 0, 1]
	] as const;

	private _pumpScheduled = false;
	private playerPos = new THREE.Vector3();

	private solidMat = new THREE.MeshStandardMaterial({
		color: 0x808080,
		flatShading: true,
		map: textureAtlas.texture
	});
	private transpMat = new THREE.MeshStandardMaterial({
		color: 0x80c0ff,
		side: THREE.DoubleSide,
		depthWrite: false,
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

	/**
	 * Pobiera blok ze współrzędnych światowych
	 */
	getBlockAt(x: number, y: number, z: number): number {
		const cx = Math.floor(x / CHUNK_SIZE);
		const cy = Math.floor(y / CHUNK_SIZE);
		const cz = Math.floor(z / CHUNK_SIZE);

		const key = this.getChunkKey(cx, cy, cz);
		const chunk = this.chunks.get(key);

		if (!chunk) {
			return -1;
		}

		if (!chunk.voxels) {
			return 0; // air if chunk not loaded
		}

		const localX = x - cx * CHUNK_SIZE;
		const localY = y - cy * CHUNK_SIZE;
		const localZ = z - cz * CHUNK_SIZE;

		return chunk.voxels[localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE];
	}

	/**
	 * Ustawia blok i automatycznie robi remesh
	 */
	setBlockAt(x: number, y: number, z: number, blockId: number): boolean {
		const cx = Math.floor(x / CHUNK_SIZE);
		const cy = Math.floor(y / CHUNK_SIZE);
		const cz = Math.floor(z / CHUNK_SIZE);

		const key = this.getChunkKey(cx, cy, cz);
		const chunk = this.chunks.get(key);

		if (!chunk || !chunk.voxels) {
			Debug.log(DebugType.WORLD, DebugLevel.WARN, 'Cannot set block - chunk not loaded', {
				worldPos: `${x},${y},${z}`,
				chunkPos: `${cx},${cy},${cz}`
			});
			return false;
		}

		const localX = x - cx * CHUNK_SIZE;
		const localY = y - cy * CHUNK_SIZE;
		const localZ = z - cz * CHUNK_SIZE;

		const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_SIZE;
		const oldBlock = chunk.voxels[index];

		if (oldBlock === blockId) {
			return false; // No change needed
		}

		chunk.voxels[index] = blockId;

		// Request remesh for this chunk
		chunk.requestRemesh();

		Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Block changed', {
			worldPos: `${x},${y},${z}`,
			localPos: `${localX},${localY},${localZ}`,
			chunkPos: `${cx},${cy},${cz}`,
			oldBlock,
			newBlock: blockId
		});

		// Remesh neighbors if block is on chunk boundary
		if (localX === 0) this.remeshNeighbor(cx - 1, cy, cz);
		if (localX === CHUNK_SIZE - 1) this.remeshNeighbor(cx + 1, cy, cz);
		if (localY === 0) this.remeshNeighbor(cx, cy - 1, cz);
		if (localY === CHUNK_SIZE - 1) this.remeshNeighbor(cx, cy + 1, cz);
		if (localZ === 0) this.remeshNeighbor(cx, cy, cz - 1);
		if (localZ === CHUNK_SIZE - 1) this.remeshNeighbor(cx, cy, cz + 1);

		return true;
	}

	/**
	 * Pomocnicza metoda do remeshu sąsiadów
	 */
	private remeshNeighbor(cx: number, cy: number, cz: number): void {
		const key = this.getChunkKey(cx, cy, cz);
		const chunk = this.chunks.get(key);

		if (chunk && chunk.voxels) {
			chunk.requestRemesh();
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Neighbor remesh requested', {
				chunkPos: `${cx},${cy},${cz}`
			});
		}
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
		const cy = Math.floor(playerPos.y / CHUNK_SIZE);
		const cz = Math.floor(playerPos.z / CHUNK_SIZE);

		const hasMoved =
			this.lastPlayerChunkX !== cx || this.lastPlayerChunkZ !== cz || this.lastPlayerChunkY !== cy;

		if (hasMoved) {
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Player moved to new chunk', {
				from: `${this.lastPlayerChunkX},${this.lastPlayerChunkY},${this.lastPlayerChunkZ}`,
				to: `${cx},${cy},${cz}`
			});
			this.lastPlayerChunkX = cx;
			this.lastPlayerChunkZ = cz;
			this.lastPlayerChunkY = cy;
			// ✅ Reprioritize existing queue
			const queueSize = this.queue.length;
			for (const job of this.queue) {
				job.priority = this.priorityFor(job.chunk);
			}
			if (queueSize > 0) {
				Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Reprioritized queue', {
					queueSize: queueSize
				});
			}
			const needed = new Set<string>();
			let chunksToLoad = 0;

			for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
				for (let y = -this.viewDistance; y <= this.viewDistance; y++) {
					for (let z = -this.viewDistance; z <= this.viewDistance; z++) {
						// Spherical check
						const distSq = x * x + y * y + z * z;
						if (distSq > this.viewDistSq) continue;

						const key = this.getChunkKey(cx + x, cy + y, cz + z);
						needed.add(key);
						if (!this.chunks.has(key)) {
							chunksToLoad++;
							this.loadChunk(cx + x, cy + y, cz + z);
						}
					}
				}
			}
			// usuń chunki poza zasięgiem
			let chunksUnloaded = 0;
			for (const key of this.chunks.keys()) {
				if (!needed.has(key)) {
					chunksUnloaded++;
					this.unloadChunk(key);
				}
			}
			if (chunksToLoad > 0 || chunksUnloaded > 0) {
				Debug.log(DebugType.WORLD, DebugLevel.INFO, 'Chunk load/unload', {
					loaded: chunksToLoad,
					unloaded: chunksUnloaded,
					totalChunks: this.chunks.size,
					queueSize: this.queue.length
				});
			}
		}
		this.schedulePump();
	}

	enqueueRemesh(chunk: Chunk, token: number) {
		const key = this.getChunkKey(chunk.cx, chunk.cy, chunk.cz);
		if (!this.neighborsReady(chunk.cx, chunk.cy, chunk.cz)) {
			chunk.needsRemesh = true; // zapamiętaj, że trzeba będzie przebudować
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Remesh deferred (neighbors missing)', { key });
			return;
		}
		if (this.inFlight.has(key)) {
			chunk.needsRemesh = true;
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Remesh skipped (in flight)', { key });
			return;
		}
		const wasQueued = this.queued.has(key);
		if (!wasQueued) {
			this.queued.add(key);
			this.queue.push({ key, chunk, token, priority: this.priorityFor(chunk) });
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Chunk queued for remesh', {
				key,
				priority: this.priorityFor(chunk),
				queueSize: this.queue.length
			});
		} else {
			// odśwież istniejący wpis (token + priority)
			for (let i = 0; i < this.queue.length; i++) {
				if (this.queue[i].key === key) {
					this.queue[i].token = token;
					this.queue[i].priority = this.priorityFor(chunk);
					Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Chunk remesh updated', { key });
					break;
				}
			}
		}
	}

	private neighborsReady(cx: number, cy: number, cz: number): boolean {
		for (const [dx, dy, dz] of WorldChunkManager.neighborDirs) {
			const nk = this.getChunkKey(cx + dx, cy + dy, cz + dz);
			const n = this.chunks.get(nk);
			if (!n || !n.voxels) return false;
		}
		return true;
	}

	private tryQueueRemesh(c: Chunk): boolean {
		const key = this.getChunkKey(c.cx, c.cy, c.cz);

		if (!c.voxels) return false;
		if (!this.neighborsReady(c.cx, c.cy, c.cz)) return false;
		if (this.inFlight.has(key) || this.queued.has(key)) return false;

		const needs = !c.meshes || c.needsRemesh; // jeśli masz taki znacznik; inaczej wystarczy !c.meshes || c.needsRemesh
		if (!needs) return false;

		this.enqueueRemesh(c, c.currentToken());
		return true;
	}

	// Po załadowaniu chunku „kopnij” lokalny obszar (self + 6 sąsiadów).
	// Opcjonalny limit zabezpiecza budżet zleceń w jednej klatce.
	private kickLocalMeshing(cx: number, cy: number, cz: number, limit = 7) {
		const candidates: string[] = [this.getChunkKey(cx, cy, cz)];
		for (const [dx, dy, dz] of WorldChunkManager.neighborDirs) {
			candidates.push(this.getChunkKey(cx + dx, cy + dy, cz + dz));
		}

		let queued = 0;
		for (const key of candidates) {
			const ch = this.chunks.get(key);
			if (!ch) continue;
			if (this.tryQueueRemesh(ch)) {
				queued++;
				if (queued >= limit) break;
			}
		}

		if (queued > 0) {
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Local meshing kick', {
				source: `${cx},${cy},${cz}`,
				queued
			});
			this.schedulePump(); // odpal przetwarzanie kolejki ASAP
		}
	}

	private pumpQueue() {
		if (this.queue.length === 0) return;
		const startTime = performance.now();
		Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Pump queue started', {
			queueSize: this.queue.length,
			inFlight: this.inFlight.size
		});
		// Only sort if queue changed significantly, or use priority queue data structure
		if (this.queue.length > 10) {
			this.queue.sort((a, b) => a.priority - b.priority);
		}

		let budget = this.REMESH_BUDGET;
		let processed = 0;
		let skipped = 0;

		while (budget > 0 && this.queue.length) {
			const job = this.queue.shift()!;
			const { key, token, chunk } = job;
			this.queued.delete(key);

			// jeśli w mapie nie ma już TEGO samego obiektu, porzuć joba
			const current = this.chunks.get(key);
			if (!current || current !== chunk) {
				skipped++;
				Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Job skipped (chunk unloaded)', { key });
				continue;
			}
			if (!this.neighborsReady(chunk.cx, chunk.cy, chunk.cz)) {
				skipped++;
				chunk.needsRemesh = true; // spróbujemy ponownie, gdy warunek się domknie
				Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Job deferred (neighbors changed)', { key });
				continue;
			}
			if (this.inFlight.has(key)) {
				skipped++;
				continue;
			}

			this.inFlight.add(key);
			processed++;

			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Building mesh for chunk', {
				key,
				priority: job.priority.toFixed(2),
				token
			});

			chunk
				.buildMeshData()
				.then(({ solid, transparent }: { solid: MeshData; transparent: MeshData }) => {
					if (token !== chunk.currentToken()) {
						Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Mesh dropped (stale token)', {
							key,
							expectedToken: chunk.currentToken(),
							actualToken: token
						});
						return;
					}

					const meshes: THREE.Mesh[] = [];
					const mk = (data: MeshData, material: THREE.Material) => {
						if (!data || data.positions.length === 0) {
							return;
						}
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

					// Check if chunk still exists before applying
					if (!this.chunks.has(key) || this.chunks.get(key) !== chunk) {
						// Cleanup geometries
						Debug.log(
							DebugType.WORLD,
							DebugLevel.WARN,
							'Mesh dropped (chunk unloaded during build)',
							{
								key
							}
						);
						meshes.forEach((m) => m.geometry.dispose());
						this.inFlight.delete(key);
						return;
					}

					chunk.applyMesh(meshes);
					Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Mesh applied successfully', {
						key,
						solidVertices: solid?.positions.length / 3 || 0,
						transparentVertices: transparent?.positions.length / 3 || 0
					});
				})
				.catch((error) => {
					Debug.log(DebugType.WORLD, DebugLevel.ERROR, 'Mesh building failed', {
						key,
						error: error.message
					});
				})
				.finally(() => {
					this.inFlight.delete(key);
					if (chunk.needsRemesh) {
						chunk.needsRemesh = false;
						chunk.requestRemesh(); // Zlecić ponownie
					}
				});

			budget--;
		}
		const elapsed = performance.now() - startTime;
		if (processed > 0 || skipped > 0) {
			Debug.log(DebugType.WORLD, DebugLevel.INFO, 'Pump queue completed', {
				processed,
				skipped,
				remaining: this.queue.length,
				timeMs: elapsed.toFixed(2)
			});
		}

		if (elapsed > 5) {
			Debug.log(DebugType.WORLD, DebugLevel.WARN, 'Pump queue slow', {
				timeMs: elapsed.toFixed(2),
				processed
			});
		}
	}

	private priorityFor(c: Chunk): number {
		// Avoid Vector3 allocation
		const centerX = c.cx * CHUNK_SIZE + CHUNK_SIZE * 0.5;
		const centerY = c.cy * CHUNK_SIZE + CHUNK_SIZE * 0.5;
		const centerZ = c.cz * CHUNK_SIZE + CHUNK_SIZE * 0.5;

		const dx = centerX - this.playerPos.x;
		const dy = centerY - this.playerPos.y;
		const dz = centerZ - this.playerPos.z;
		const d2 = dx * dx + dy * dy + dz * dz;

		const penalty = c.meshes ? CHUNK_SIZE * CHUNK_SIZE * 100 : 0;
		return d2 + penalty;
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
		const startTime = performance.now();

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

		const elapsed = performance.now() - startTime;
		if (elapsed > 2) {
			Debug.log(DebugType.WORLD, DebugLevel.WARN, 'Halo generation slow', {
				key: `${cx},${cy},${cz}`,
				timeMs: elapsed.toFixed(2)
			});
		}

		return haloVoxels;
	}
	private async loadChunk(cx: number, cy: number, cz: number) {
		const key = this.getChunkKey(cx, cy, cz);

		if (this.loadingChunks.has(key)) {
			Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Chunk already loading', { key });
			return;
		} // Already loading
		this.loadingChunks.add(key);
		Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Loading chunk', { key });

		try {
			const startTime = performance.now();
			const voxels = await this.chunkService.generateChunk(cx, cy, cz, this.seed);
			const elapsed = performance.now() - startTime;

			// Check if still needed
			if (this.chunks.has(key) || !this.loadingChunks.has(key)) {
				Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Chunk load cancelled', {
					key,
					reason: this.chunks.has(key) ? 'already loaded' : 'was unloaded'
				});
				return; // Was unloaded or duplicate
			}

			const chunk = new Chunk(this.scene, this.seed, cx, cy, cz);
			chunk.voxels = new Uint8Array(voxels);
			this.chunks.set(key, chunk);
			// ✅ WAŻNE: Poczekaj na następną klatkę przed remeshem
			// aby upewnić się, że wszystkie dane są gotowe
			await new Promise((resolve) => requestAnimationFrame(resolve));
			// ✅ Sprawdź ponownie czy chunk nadal istnieje
			if (!this.chunks.has(key)) {
				Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Chunk unloaded before remesh', { key });
				return;
			}
			this.kickLocalMeshing(cx, cy, cz);
			Debug.log(DebugType.WORLD, DebugLevel.INFO, 'Chunk loaded', {
				key,
				timeMs: elapsed.toFixed(2),
				voxelCount: voxels.length
			});
		} catch (error) {
			Debug.log(DebugType.WORLD, DebugLevel.ERROR, 'Chunk loading failed', {
				key,
				error: error instanceof Error ? error.message : String(error)
			});
		} finally {
			this.loadingChunks.delete(key);
		}
	}

	private unloadChunk(key: string) {
		const chunk = this.chunks.get(key);
		if (!chunk) return;

		Debug.log(DebugType.WORLD, DebugLevel.DEBUG, 'Unloading chunk', { key });

		// Instead of filter, iterate and rebuild
		const newQueue: Job[] = [];
		for (const job of this.queue) {
			if (job.key !== key) newQueue.push(job);
		}
		this.queue = newQueue;
		this.queued.delete(key);
		this.inFlight.delete(key);
		this.loadingChunks.delete(key);

		chunk.needsRemesh = false;
		chunk.unload();
		this.chunks.delete(key);
	}

	disposeAll() {
		Debug.log(DebugType.WORLD, DebugLevel.INFO, 'Disposing all chunks', {
			totalChunks: this.chunks.size,
			queueSize: this.queue.length
		});
		for (const chunk of this.chunks.values()) {
			chunk.unload();
		}
		this.chunks.clear();
		this.queue = [];
		this.queued.clear();
		this.inFlight.clear();
		this.loadingChunks.clear();
		Debug.log(DebugType.WORLD, DebugLevel.INFO, 'All chunks disposed');
	}
}
