// src/game/mesher.ts
import * as THREE from 'three';
import { Block, BlockId } from './blocks';
import type { TextureAtlas } from '../textures/textureAtlas';

export class Mesher {
	static build(
		scene: THREE.Scene,
		voxels: Uint8Array,
		width: number,
		height: number,
		depth: number,
		cx = 0,
		cy = 0,
		cz = 0,
		atlas?: TextureAtlas
	) {
		const chunkOffset = new THREE.Vector3(cx * width, cy * height, cz * depth);
		const dirs = [
			[1, 0, 0],
			[-1, 0, 0],
			[0, 1, 0],
			[0, -1, 0],
			[0, 0, 1],
			[0, 0, -1]
		];

		const faceVerts = [
			[
				[0.5, -0.5, -0.5],
				[0.5, 0.5, -0.5],
				[0.5, 0.5, 0.5],
				[0.5, -0.5, 0.5]
			], // +X
			[
				[-0.5, -0.5, 0.5],
				[-0.5, 0.5, 0.5],
				[-0.5, 0.5, -0.5],
				[-0.5, -0.5, -0.5]
			], // -X
			[
				[-0.5, 0.5, 0.5],
				[0.5, 0.5, 0.5],
				[0.5, 0.5, -0.5],
				[-0.5, 0.5, -0.5]
			], // +Y
			[
				[-0.5, -0.5, -0.5],
				[0.5, -0.5, -0.5],
				[0.5, -0.5, 0.5],
				[-0.5, -0.5, 0.5]
			], // -Y
			[
				[-0.5, -0.5, 0.5],
				[0.5, -0.5, 0.5],
				[0.5, 0.5, 0.5],
				[-0.5, 0.5, 0.5]
			], // +Z
			[
				[0.5, -0.5, -0.5],
				[-0.5, -0.5, -0.5],
				[-0.5, 0.5, -0.5],
				[0.5, 0.5, -0.5]
			] // -Z
		];

		const index = (x: number, y: number, z: number) => x + y * width + z * width * height;
		const blockSize = 1;

		// Osobne bufory dla solid i transparent bloków
		const solidData = {
			positions: [] as number[],
			normals: [] as number[],
			uvs: [] as number[],
			indices: [] as number[],
			vertexCount: 0
		};

		const transparentData = {
			positions: [] as number[],
			normals: [] as number[],
			uvs: [] as number[],
			indices: [] as number[],
			vertexCount: 0
		};

		// Mapa pozycji wierzchołków dla współdzielenia
		const vertexMap = new Map<string, number>();
		const transparentVertexMap = new Map<string, number>();

		const getOrCreateVertex = (
			x: number,
			y: number,
			z: number,
			nx: number,
			ny: number,
			nz: number,
			u: number,
			v: number,
			isTransparent: boolean
		): number => {
			const data = isTransparent ? transparentData : solidData;
			const map = isTransparent ? transparentVertexMap : vertexMap;

			// Klucz zawiera pozycję, normal i UV
			const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)},${nx},${ny},${nz},${u.toFixed(4)},${v.toFixed(4)}`;

			let vertexIndex = map.get(key);
			if (vertexIndex === undefined) {
				vertexIndex = data.vertexCount++;
				map.set(key, vertexIndex);

				data.positions.push(x, y, z);
				data.normals.push(nx, ny, nz);
				data.uvs.push(u, v);
			}

			return vertexIndex;
		};

		// Iteruj przez wszystkie voxele jeden raz
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < depth; z++) {
					const blockId = voxels[index(x, y, z)] as BlockId;
					if (blockId === 0) continue; // skip air

					const blockDef = Block.getDef(blockId);
					const isTransparent = blockDef.transparent;
					const data = isTransparent ? transparentData : solidData;

					// Sprawdź każdą ścianę
					for (let f = 0; f < 6; f++) {
						const [dx, dy, dz] = dirs[f];
						const nx = x + dx;
						const ny = y + dy;
						const nz = z + dz;

						let neighbor = 0;
						if (nx < 0 || ny < 0 || nz < 0 || nx >= width || ny >= height || nz >= depth) {
							neighbor = 0;
						} else {
							neighbor = voxels[index(nx, ny, nz)];
						}

						const neighborBlock = Block.getDef(neighbor as BlockId);
						if (neighbor === 0 || neighborBlock.transparent) {
							// Renderuj tę ścianę
							const vtx = faceVerts[f];

							// Pobierz UV coordinates dla tego bloku
							let u0 = 0,
								v0 = 0,
								u1 = 0,
								v1 = 0;
							if (atlas) {
								const uvRect = atlas.uvs[blockId];
								if (uvRect) {
									u0 = uvRect.x;
									v0 = uvRect.y;
									u1 = uvRect.z;
									v1 = uvRect.w;

									// Flip V coordinates (Canvas origin top vs Three.js origin bottom)
									const topV = 1 - v0;
									const bottomV = 1 - v1;
									v0 = topV;
									v1 = bottomV;
								}
							}

							// UV mapping dla quad
							const quadUVs = [
								[u1, v1], // bottom-right
								[u1, v0], // top-right
								[u0, v0], // top-left
								[u0, v1] // bottom-left
							];

							// Dodaj 4 wierzchołki (współdzielone jeśli już istnieją)
							const indices: number[] = [];
							for (let vi = 0; vi < 4; vi++) {
								const p = vtx[vi];
								const worldX = (p[0] + x + chunkOffset.x - width / 2) * blockSize;
								const worldY = (p[1] + y + chunkOffset.y) * blockSize;
								const worldZ = (p[2] + z + chunkOffset.z - depth / 2) * blockSize;

								const [uu, vv] = quadUVs[vi];

								const vertexIndex = getOrCreateVertex(
									worldX,
									worldY,
									worldZ,
									dx,
									dy,
									dz,
									uu,
									vv,
									isTransparent
								);

								indices.push(vertexIndex);
							}

							// Dodaj 2 trójkąty (6 indeksów)
							data.indices.push(
								indices[0],
								indices[1],
								indices[2],
								indices[0],
								indices[2],
								indices[3]
							);
						}
					}
				}
			}
		}

		const meshes: THREE.Mesh[] = [];

		// Stwórz mesh dla solid bloków
		if (solidData.positions.length > 0) {
			const geom = new THREE.BufferGeometry();
			geom.setAttribute('position', new THREE.Float32BufferAttribute(solidData.positions, 3));
			geom.setAttribute('normal', new THREE.Float32BufferAttribute(solidData.normals, 3));
			geom.setAttribute('uv', new THREE.Float32BufferAttribute(solidData.uvs, 2));
			geom.setIndex(solidData.indices);
			geom.computeBoundingSphere();

			let mat: THREE.Material;
			if (atlas) {
				mat = new THREE.MeshStandardMaterial({
					map: atlas.texture,
					flatShading: true
				});
			} else {
				mat = new THREE.MeshStandardMaterial({
					color: 0x808080,
					flatShading: true
				});
			}

			const mesh = new THREE.Mesh(geom, mat);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
		}

		// Stwórz mesh dla transparent bloków
		if (transparentData.positions.length > 0) {
			const geom = new THREE.BufferGeometry();
			geom.setAttribute('position', new THREE.Float32BufferAttribute(transparentData.positions, 3));
			geom.setAttribute('normal', new THREE.Float32BufferAttribute(transparentData.normals, 3));
			geom.setAttribute('uv', new THREE.Float32BufferAttribute(transparentData.uvs, 2));
			geom.setIndex(transparentData.indices);
			geom.computeBoundingSphere();

			let mat: THREE.Material;
			if (atlas) {
				mat = new THREE.MeshStandardMaterial({
					map: atlas.texture,
					transparent: true,
					opacity: 0.6,
					flatShading: true
				});
			} else {
				mat = new THREE.MeshStandardMaterial({
					color: 0x4080ff,
					transparent: true,
					opacity: 0.6,
					flatShading: true
				});
			}

			const mesh = new THREE.Mesh(geom, mat);
			mesh.castShadow = false;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
		}

		return {
			meshes,
			dispose() {
				for (const m of meshes) {
					m.geometry.dispose();
					(m.material as THREE.Material).dispose();
					scene.remove(m);
				}
			}
		};
	}
}
