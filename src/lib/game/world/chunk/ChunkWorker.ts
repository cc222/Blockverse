import { expose } from 'threads/worker';
import { TerrainGenerator } from '../TerrainGenerator';

expose({
	generateChunk: (cx: number, cy: number, cz: number, CHUNK_SIZE: number, seed: number) => {
		//console.log('Worker generating chunk at', cx, cy, cz);
		const voxels = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
		const generator = new TerrainGenerator({ seed: seed });

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let y = 0; y < CHUNK_SIZE; y++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const wx = cx * CHUNK_SIZE + x;
					const wy = cy * CHUNK_SIZE + y;
					const wz = cz * CHUNK_SIZE + z;
					voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = generator.sample(wx, wy, wz);
				}
			}
		}

		return voxels.buffer; // zwracamy transferable
	}
});
