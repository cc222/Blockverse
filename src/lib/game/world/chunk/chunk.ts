// src/game/chunk.ts
import { CHUNK_SIZE, HALO } from '$lib/game/GameConts';
import { GameManager } from '$lib/game/GameManger';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import * as THREE from 'three';
import { WorldManager } from '../WorldManager';

export class Chunk {
	//TODO: add cashed borders voxels for meshing optimization
	cx: number;
	cy: number;
	cz: number;
	voxels: Uint8Array;
	meshes?: THREE.Mesh[];
	scene: THREE.Scene;
	seed: number;
	private buildingMesh: boolean = false;

	constructor(scene: THREE.Scene, seed: number, cx: number, cy: number, cz: number) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.scene = scene;
		this.seed = seed;
		this.voxels = new Uint8Array(CHUNK_SIZE ** 3);
	}

	requestRemesh() {
		if (this.buildingMesh) return; // unikamy dublowania
		this.buildingMesh = true;
		this.buildMesh();
	}

	index(x: number, y: number, z: number): number {
		return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
	}

	async buildMesh() {
		this.buildingMesh = true;
		await this._buildMesh(WorldManager.chunkManager.getHaloVoxels(this.cx, this.cy, this.cz));
		this.buildingMesh = false;
	}

	private async _buildMesh(haloVoxels: Uint8Array) {
		const { solid, transparent } = await GameManager.instance.mesherService.build(
			haloVoxels,
			CHUNK_SIZE + 2 * HALO,
			CHUNK_SIZE + 2 * HALO,
			CHUNK_SIZE + 2 * HALO,
			this.cx,
			this.cy,
			this.cz
		);

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
	}

	unload(): void {
		if (this.meshes) {
			for (const mesh of this.meshes) {
				mesh.geometry.dispose();
				this.scene.remove(mesh);
			}
			this.meshes = undefined;
		}
	}
}
