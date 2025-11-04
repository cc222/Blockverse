import { spawn, Worker, Pool } from 'threads';

const CHUNK_SIZE = 16;
const POOL_SIZE = 4; // liczba równoległych workerów

export class ChunkService {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private pool: Pool<any>;

	constructor() {
		this.pool = new Pool(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			() => spawn(new Worker(new URL('./ChunkWorker.ts', import.meta.url), { type: 'module' })),
			POOL_SIZE
		);
	}

	async generateChunk(cx: number, cy: number, cz: number, seed: number): Promise<Uint8Array> {
		const buffer = await this.pool.queue(async (worker) => {
			const result = await worker.generateChunk(cx, cy, cz, CHUNK_SIZE, seed);
			return result;
		});

		// od razu konwertujemy zwrócony ArrayBuffer na Uint8Array
		return new Uint8Array(buffer);
	}

	async destroy() {
		await this.pool.terminate();
	}
}
