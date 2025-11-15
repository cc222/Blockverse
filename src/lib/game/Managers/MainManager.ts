import { GameManager } from '../GameManger';
import { createTextureAtlas } from '../textures/textureAtlas';
//import { createTextureAtlas } from '../textures/textureAtlas';
import { BaseManager } from './BaseManager';

export class MainManager extends BaseManager {
	private gameManagerDispose: (() => void) | null = null;
	public static instance: MainManager;
	//public gameManager!: GameManager;
	constructor(public gameCanvas: HTMLCanvasElement) {
		super();
		MainManager.instance = this;
		MainManager.afterInitialization(async () => {
			await createTextureAtlas();
			// ważne: await i przechowanie dispose
			const maybeDispose = await GameManager.initialize(gameCanvas);
			// jeśli initialize zwraca dispose lub promise<dispose>
			this.gameManagerDispose = typeof maybeDispose === 'function' ? maybeDispose : null;
		});
		MainManager.onDestroy(() => {
			this.gameManagerDispose?.();
			this.gameManagerDispose = null;
		});
	}
}
