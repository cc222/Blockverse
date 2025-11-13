import { spawn, Worker, Pool } from 'threads';
import type { MeshBuffers } from './MeshBuffers';
import { textureAtlas } from '$lib/game/textures/textureAtlas';
import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';

const POOL_SIZE = 6;

export class MesherService {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pool: Pool<any>;
	private blockUVs: Record<number, { x: number; y: number; z: number; w: number }> = {};

	constructor() {
		this.pool = new Pool(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			() => spawn(new Worker(new URL('./MesherWorker.ts', import.meta.url), { type: 'module' })),
			POOL_SIZE
		);
		for (const [blockId, rect] of Object.entries(textureAtlas.uvs)) {
			this.blockUVs[blockId] = { x: rect.x, y: rect.y, z: rect.z, w: rect.w };
		}
		Debug.log(
			DebugType.MESHER,
			DebugLevel.DEBUG,
			'MesherService initialized with block UVs:',
			this.blockUVs
		);
	}

	async build(
		voxels: Uint8Array,
		width: number,
		height: number,
		depth: number,
		cx: number,
		cy: number,
		cz: number
	): Promise<MeshBuffers> {
		return this.pool.queue((worker) =>
			worker.buildMesh(voxels, width, height, depth, cx, cy, cz, this.blockUVs)
		);
	}

	async destroy() {
		await this.pool.terminate();
	}
}
