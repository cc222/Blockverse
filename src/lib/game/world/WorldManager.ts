import { ThreeManager } from '../Managers/ThreeManager';
import { ChunkService } from './chunk/ChunkService';
import { WorldChunkManager } from './chunk/WorldChunkManager';

export class WorldManager {
	//TODO: make non-static add to GameManager
	static seed: number;
	static chunkService: ChunkService;
	static chunkManager: WorldChunkManager;

	static init(threeManager: ThreeManager) {
		this.seed = Math.random() * 10000;
		this.chunkService = new ChunkService();
		this.chunkManager = new WorldChunkManager(threeManager.scene, this.seed, this.chunkService);
	}

	static update(threeManager: ThreeManager) {
		this.chunkManager.update(threeManager.camera.position);
	}
}
