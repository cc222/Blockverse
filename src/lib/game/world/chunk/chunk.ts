// src/game/chunk.ts
import { GameManager } from '$lib/game/GameManger';
import { WorldSettings } from '$lib/game/settings/world';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import * as THREE from 'three';

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

	constructor(scene: THREE.Scene, seed: number, cx: number, cy: number, cz: number) {
		this.cx = cx;
		this.cy = cy;
		this.cz = cz;
		this.scene = scene;
		this.seed = seed;
		this.voxels = new Uint8Array(CHUNK_SIZE ** 3);
	}

	index(x: number, y: number, z: number): number {
		return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
	}

	async buildMesh() {
		const { solid, transparent } = await GameManager.instance.mesherService.build(
			this.voxels,
			CHUNK_SIZE,
			CHUNK_SIZE,
			CHUNK_SIZE,
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

	dispose(): void {
		if (this.meshGroup) {
			this.meshGroup.dispose();
			this.meshGroup = undefined;
		}
	}
}
