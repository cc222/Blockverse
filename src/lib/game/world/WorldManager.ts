import { ThreeManager } from '../ThreeManager';
import { ChunkService } from './chunk/ChunkService';
import { WorldChunkManager } from './chunk/WorldChunkManager';

export class WorldManager {
	static seed: number;
	static chunkService: ChunkService;
	static chunkManager: WorldChunkManager;

	static init() {
		this.seed = Math.random() * 10000;
		this.chunkService = new ChunkService();
		this.chunkManager = new WorldChunkManager(ThreeManager.scene, this.seed, this.chunkService);
	}

	static update() {
		this.chunkManager.update(ThreeManager.camera.position);
	}
}
