// src/game/chunk.ts
import { CHUNK_SIZE, HALO } from '$lib/game/GameConts';
import { GameManager } from '$lib/game/GameManger';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import * as THREE from 'three';
import { WorldManager } from '../WorldManager';
import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';

export class Chunk {
	//TODO: add cashed borders voxels for meshing optimization
	cx: number;
	cy: number;
	cz: number;
	voxels: Uint8Array;
	meshes?: THREE.Mesh[];
	scene: THREE.Scene;
	seed: number;

	private buildingMesh = false; // czy aktualnie trwa budowa
	private queued = false; // czy ktoś poprosił o kolejny remesh w trakcie budowy
	private token = 0; // rośnie przy każdym requestRemesh()
	private debounceMs = 50; // miękki debounce (możesz ustawić na 0, by wyłączyć)
	private lastRequestAt = 0;

	constructor(scene: THREE.Scene, seed: number, cx: number, cy: number, cz: number) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.scene = scene;
		this.seed = seed;
		this.voxels = new Uint8Array(CHUNK_SIZE ** 3);
	}

	requestRemesh() {
		const now = performance.now?.() ?? Date.now();
		const withinDebounce = now - this.lastRequestAt < this.debounceMs;
		this.lastRequestAt = now;

		this.token++; // nadajemy nowy „numer wersji” remeshu
		if (this.buildingMesh) {
			// już w toku -> tylko zaznacz, że po skończeniu mamy zrobić raz jeszcze
			this.queued = true;
			return;
		}
		if (withinDebounce) {
			// zbyt gęsto -> poczekaj do zakończenia obecnej rundy
			this.queued = true;
			return;
		}
		this.startBuildMesh(this.token);
	}

	index(x: number, y: number, z: number): number {
		return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
	}

	async startBuildMesh(expectedToken: number) {
		this.buildingMesh = true;
		Debug.log(
			DebugType.CHUNK,
			DebugLevel.DEBUG,
			`Budowanie meshu dla chunku ${this.cx},${this.cy},${this.cz}`
		);
		await this._buildMesh(expectedToken);
	}

	private async _buildMesh(expectedToken: number) {
		const haloVoxels = WorldManager.chunkManager.getHaloVoxels(this.cx, this.cy, this.cz);

		const { solid, transparent } = await GameManager.instance.mesherService.build(
			haloVoxels,
			CHUNK_SIZE + 2 * HALO,
			CHUNK_SIZE + 2 * HALO,
			CHUNK_SIZE + 2 * HALO,
			this.cx,
			this.cy,
			this.cz
		);

		if (expectedToken !== this.token) {
			Debug.log(
				DebugType.CHUNK,
				DebugLevel.DEBUG,
				`DROP wynik dla chunku ${this.cx},${this.cy},${this.cz} t=${expectedToken} != cur=${this.token}`
			);
			this.buildingMesh = false;
			// jeśli ktoś kliknął „queued” w międzyczasie – odpal natychmiast następną, ale z aktualnym tokenem
			if (this.queued) {
				this.queued = false;
				this.startBuildMesh(this.token);
			}
			return;
		}

		if (this.meshes) {
			for (const mesh of this.meshes) {
				mesh.geometry.dispose();
				this.scene.remove(mesh);
				// UWAGA: jeśli materiał nie jest współdzielony, rozważ też mesh.material.dispose()
			}
			this.meshes = undefined;
		}

		const meshes: THREE.Mesh[] = [];

		const makeMesh = (data, materialOpts, texture?: THREE.Texture) => {
			if (data.positions.length === 0) return;
			const geom = new THREE.BufferGeometry();
			geom.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
			geom.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
			geom.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
			geom.setIndex(new THREE.Uint32BufferAttribute(data.indices, 1));

			const mat = new THREE.MeshStandardMaterial({
				...materialOpts,
				map: texture // <-- tutaj podajesz atlas tekstur
			});

			const mesh = new THREE.Mesh(geom, mat);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			this.scene.add(mesh);
			meshes.push(mesh);
		};

		makeMesh(solid, { color: 0x808080, flatShading: true }, textureAtlas.texture);
		makeMesh(
			transparent,
			{ color: 0x80c0ff, transparent: true, opacity: 0.6, flatShading: true },
			textureAtlas.texture
		);

		this.meshes = meshes;
		Debug.log(
			DebugType.CHUNK,
			DebugLevel.DEBUG,
			`Skonczono budowanie meshu dla chunku ${this.cx},${this.cy},${this.cz}`
		);
		if (this.queued) {
			this.queued = false;
			// nie zwiększamy tokena – już został zwiększony w requestRemesh(); bierzemy aktualny
			this.startBuildMesh(this.token);
		}
	}

	unload(): void {
		this.token++;
		this.queued = false;
		if (this.meshes) {
			for (const mesh of this.meshes) {
				mesh.geometry.dispose();
				this.scene.remove(mesh);
			}
			this.meshes = undefined;
		}
	}
}
