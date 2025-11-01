// src/game/mesher.ts
import * as THREE from 'three';
import { Block, type BlockType } from './blocks';

export class Mesher {
	static build(
		scene: THREE.Scene,
		voxels: Uint8Array,
		width: number,
		height: number,
		depth: number,
		cx = 0,
		cy = 0,
		cz = 0
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
		const meshes: THREE.Mesh[] = [];
		const blockSize = 1;

		for (const [type, color] of Object.entries(Block.colors)) {
			const id = Block.toId(type as BlockType);
			if (id === 0) continue; // air
			const verts: number[] = [];
			const norms: number[] = [];
			const idx: number[] = [];
			let offset = 0;

			for (let x = 0; x < width; x++) {
				for (let y = 0; y < height; y++) {
					for (let z = 0; z < depth; z++) {
						const v = voxels[index(x, y, z)];
						if (v !== id) continue;

						for (let f = 0; f < 6; f++) {
							const [dx, dy, dz] = dirs[f];
							const nx = x + dx,
								ny = y + dy,
								nz = z + dz;
							let neighbor = 0;
							if (nx < 0 || ny < 0 || nz < 0 || nx >= width || ny >= height || nz >= depth) {
								neighbor = 0;
							} else {
								neighbor = voxels[index(nx, ny, nz)];
							}

							const neighborBlock = Block.fromId(neighbor);
							if (neighbor === 0 || neighborBlock.transparent) {
								const vtx = faceVerts[f];
								const n = new THREE.Vector3(dx, dy, dz);
								for (const p of vtx) {
									verts.push(
										(p[0] + x + chunkOffset.x - width / 2) * blockSize,
										(p[1] + y + chunkOffset.y) * blockSize,
										(p[2] + z + chunkOffset.z - depth / 2) * blockSize
									);
									norms.push(n.x, n.y, n.z);
								}
								idx.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
								offset += 4;
							}
						}
					}
				}
			}

			if (verts.length === 0) continue;

			const geom = new THREE.BufferGeometry();
			geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
			geom.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
			geom.setIndex(idx);
			geom.computeBoundingSphere();

			const mat = new THREE.MeshStandardMaterial({
				color,
				transparent: type === 'water',
				opacity: type === 'water' ? 0.6 : 1,
				flatShading: true
			});

			const mesh = new THREE.Mesh(geom, mat);
			mesh.castShadow = type !== 'water';
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
