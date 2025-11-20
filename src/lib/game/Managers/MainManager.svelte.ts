import { createTextureAtlas } from '../textures/textureAtlas';
import { BaseManager } from './BaseManager';
import { ControlsManager } from './ControlsManager';
import { GameManager } from './GameManger.svelte';
import { MainMenuManager } from './MainMenuManager.svelte';
import { MenuManager } from './MenuManager.svelte';
import { ThreeManager } from './ThreeManager';

export enum GameState {
	MAIN_MENU,
	IN_GAME,
	PAUSED
}

export class MainManager extends BaseManager {
	public menuManager: MenuManager;
	private controlsManager: ControlsManager;
	private threeManager: ThreeManager;

	public gameManager?: GameManager;
	public mainMenuManager?: MainMenuManager;

	public gameState: GameState = $state(GameState.MAIN_MENU);

	constructor(public gameCanvas: HTMLCanvasElement) {
		super();

		// Tworzenie instancji core managers (jeszcze wyłączone)
		createTextureAtlas();
		this.threeManager = ThreeManager.createInstance(this.gameCanvas);
		this.mainMenuManager = MainMenuManager.createInstance(this.threeManager);
		this.controlsManager = ControlsManager.createInstance();
		this.menuManager = MenuManager.createInstance(this.controlsManager);
	}

	private setGameState(gameState: GameState) {
		this.gameState = gameState;
	}

	protected async showMainMenu(): Promise<void> {
		if (!this.mainMenuManager) {
			this.mainMenuManager = MainMenuManager.createInstance(this.threeManager);
		}
		this.setGameState(GameState.MAIN_MENU);
		this.gameManager = undefined;
		GameManager.destroy();
	}

	protected async onDestroy(): Promise<void> {
		// Wyłączenie wszystkiego
		await this.stopGame();
		await MenuManager.destroy();
		await ControlsManager.destroy();
		await MainMenuManager.destroy();
		await ThreeManager.destroy();
	}

	async startGame() {
		// Tworzenie instancji gry jeśli nie istnieje
		if (!this.gameManager) {
			this.gameManager = GameManager.createInstance(
				'test',
				this.gameCanvas,
				this.threeManager,
				this.controlsManager
			);
		}
		this.setGameState(GameState.IN_GAME);
		this.mainMenuManager?.destroy();
		this.mainMenuManager = undefined;
	}

	async stopGame() {
		this.showMainMenu();
	}
}
