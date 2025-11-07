import { expose } from 'threads/worker';
import { Block, BlockId } from '../blocks';
import type { MeshBuffers } from './MeshBuffers';

interface UVRect {
	x: number;
	y: number;
	z: number;
	w: number;
}

expose({
	buildMesh(
		voxels: Uint8Array,
		width: number,
		height: number,
		depth: number,
		cx: number,
		cy: number,
		cz: number,
		blockUVs: Record<number, UVRect> // przekazywane z głównego wątku
	): MeshBuffers {
		const chunkOffset = { x: cx * width, y: cy * height, z: cz * depth };
		const blockSize = 1;

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

		type MeshData = {
			positions: number[];
			normals: number[];
			uvs: number[];
			indices: number[];
			vcount: number;
		};

		const solid: MeshData = { positions: [], normals: [], uvs: [], indices: [], vcount: 0 };
		const trans: MeshData = { positions: [], normals: [], uvs: [], indices: [], vcount: 0 };

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				for (let z = 0; z < depth; z++) {
					const blockId = voxels[index(x, y, z)] as BlockId;
					if (!blockId) continue;

					const def = Block.getDef(blockId);
					const isTransparent = def.transparent;
					const target = isTransparent ? trans : solid;

					for (let f = 0; f < 6; f++) {
						const [dx, dy, dz] = dirs[f];
						const nx = x + dx;
						const ny = y + dy;
						const nz = z + dz;

						let neighbor = 0;
						if (nx < 0 || ny < 0 || nz < 0 || nx >= width || ny >= height || nz >= depth)
							neighbor = 0;
						else neighbor = voxels[index(nx, ny, nz)];

						const ndef = Block.getDef(neighbor as BlockId);
						if (neighbor === 0 || ndef.transparent) {
							const vtx = faceVerts[f];

							const uvRect = blockUVs[blockId] || { x: 0, y: 0, z: 1, w: 1 };
							const u0 = uvRect.x,
								v0 = 1 - uvRect.w,
								u1 = uvRect.z,
								v1 = 1 - uvRect.y;

							const quadUVs = [
								[u1, v1],
								[u1, v0],
								[u0, v0],
								[u0, v1]
							];

							const vBase = target.vcount;
							target.vcount += 4;

							for (let vi = 0; vi < 4; vi++) {
								const [vx, vy, vz] = vtx[vi];
								const worldX = (vx + x + chunkOffset.x - width / 2) * blockSize;
								const worldY = (vy + y + chunkOffset.y) * blockSize;
								const worldZ = (vz + z + chunkOffset.z - depth / 2) * blockSize;
								const [uu, vv] = quadUVs[vi];

								target.positions.push(worldX, worldY, worldZ);
								target.normals.push(dx, dy, dz);
								target.uvs.push(uu, vv);
							}

							target.indices.push(vBase, vBase + 1, vBase + 2, vBase, vBase + 2, vBase + 3);
						}
					}
				}
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const toArray = (arr: number[], Type: any) => new Type(arr);

		return {
			solid: {
				positions: toArray(solid.positions, Float32Array),
				normals: toArray(solid.normals, Float32Array),
				uvs: toArray(solid.uvs, Float32Array),
				indices: toArray(solid.indices, Uint32Array)
			},
			transparent: {
				positions: toArray(trans.positions, Float32Array),
				normals: toArray(trans.normals, Float32Array),
				uvs: toArray(trans.uvs, Float32Array),
				indices: toArray(trans.indices, Uint32Array)
			}
		};
	}
});
