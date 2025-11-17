import { createTextureAtlas } from '../textures/textureAtlas';
//import { createTextureAtlas } from '../textures/textureAtlas';
import { BaseManager } from './BaseManager';
import { ControlsManager } from './ControlsManager';
import { GameManager } from './GameManger';
import { MainMenuManager } from './MainMenuManager.svelte';
import { MenuManager } from './MenuManager.svelte';
import { ThreeManager } from './ThreeManager';

export class MainManager extends BaseManager {
	public static instance: MainManager;
	public menuManager!: MenuManager;
	private controlsManager!: ControlsManager;
	private gameManager?: GameManager;
	private threeManager: ThreeManager;
	public mainMenuManager?: MainMenuManager;
	//public gameManager!: GameManager;
	constructor(public gameCanvas: HTMLCanvasElement) {
		console.log('a');
		super();
		this.threeManager = ThreeManager.getInstance(this.gameCanvas);
		this.mainMenuManager = MainMenuManager.getInstance(this.threeManager);
		MainManager.instance = this;
		MainManager.afterInitialization(async () => {
			await createTextureAtlas();
			this.controlsManager = await ControlsManager.getInstance();
			this.menuManager = await MenuManager.getInstance(this.controlsManager);
			//await this.startGame();
		});
		MainManager.onDestroy(() => {
			this.stopGame();
			MenuManager.destroy();
			ControlsManager.destroy();
			GameManager.destroy();
			ThreeManager.destroy();
		});
	}

	async startGame() {
		this.gameManager = await GameManager.getInstance(
			'test',
			this.gameCanvas,
			this.threeManager,
			this.controlsManager
		);
		this.mainMenuManager?.disable();
	}
	async stopGame() {
		await GameManager.destroy();
		this.mainMenuManager?.enable();
	}
}
