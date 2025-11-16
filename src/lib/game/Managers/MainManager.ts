import { createTextureAtlas } from '../textures/textureAtlas';
//import { createTextureAtlas } from '../textures/textureAtlas';
import { BaseManager } from './BaseManager';
import { ControlsManager } from './ControlsManager';
import { GameManager } from './GameManger';
import { MenuManager } from './MenuManager.svelte';

export class MainManager extends BaseManager {
	public static instance: MainManager;
	public menuManager!: MenuManager;
	private controlsManager!: ControlsManager;
	private gameManager?: GameManager;
	//public gameManager!: GameManager;
	constructor(public gameCanvas: HTMLCanvasElement) {
		super();
		MainManager.instance = this;
		MainManager.afterInitialization(async () => {
			await createTextureAtlas();
			this.controlsManager = await ControlsManager.getInstance();
			this.menuManager = await MenuManager.getInstance(this.controlsManager);
			await this.startGame();
		});
		MainManager.onDestroy(() => {
			this.stopGame();
			MenuManager.destroy();
			ControlsManager.destroy();
			GameManager.destroy();
		});
	}

	async startGame() {
		this.gameManager = await GameManager.getInstance('test', this.gameCanvas);
	}
	async stopGame() {
		await GameManager.destroy();
	}
}
