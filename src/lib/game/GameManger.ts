import { MenuManager } from '$lib/components/menus/MenuManager.svelte';
import { ChatManager } from './Managers/ChatManager.svelte';
import { StatsOverlayManager } from './Managers/StatsOverlayManager';
import { ThreeManager } from './Managers/ThreeManager';
import { PlayerManager } from './PlayerManager';
import { GameServer } from './server/GameServer';
import { LocalTransport } from './server/Transport/LocalTransport';
import { Transport } from './server/Transport/Transport';
import { MesherService } from './world/chunk/MesherService';
import { WorldManager } from './world/WorldManager';

export class GameManager {
	public static instance: GameManager;
	private static _isInitialized: boolean = false;

	threeManager?: ThreeManager;
	statsOverlayManager?: StatsOverlayManager;
	chatManager?: ChatManager;

	//controlsManager!: GameControlsManager;
	gameServer!: GameServer;
	myPlayerId: string;
	prevFrameTime!: number;
	gameCanvas!: HTMLCanvasElement;
	mesherService!: MesherService;
	menuManager!: MenuManager;
	playerManager!: PlayerManager;
	private static onInitializeCallbacks: (() => void)[] = [];
	dispose: () => void = () => {};

	public static onInitialize(callback: () => void) {
		if (GameManager._isInitialized) {
			callback();
		} else {
			this.onInitializeCallbacks.push(callback);
		}
	}

	public static get isInitialized() {
		return GameManager._isInitialized;
	}

	private constructor(canvas: HTMLCanvasElement) {
		this.myPlayerId = 'localPlayer';
		const transportLayer = new LocalTransport(new GameServer());
		this.gameServer = Transport.createGameProxy(transportLayer);
		this.gameServer.addPlayer(this.myPlayerId, transportLayer);
		this.gameCanvas = canvas;
		GameManager.instance = this;
	}

	private loop = () => {
		requestAnimationFrame(this.loop);
		if (this.threeManager) {
			const now = performance.now();
			const delta = (now - this.prevFrameTime) / 1000;
			this.prevFrameTime = now;

			this.statsOverlayManager?.beginStatsFrame();
			this.playerManager.update(delta);
			WorldManager.update(this.threeManager);
			this.threeManager?.render();
			this.statsOverlayManager?.endStatsFrame();
		}
	};

	public async startGame() {
		this.threeManager = await ThreeManager.getInstance(this.gameCanvas);
		this.statsOverlayManager = await StatsOverlayManager.getInstance();
		this.chatManager = new ChatManager();
		this.playerManager = new PlayerManager(this.threeManager);
		WorldManager.init(this.threeManager);
	}

	private async initializeAsync(): Promise<() => void> {
		await this.startGame();
		this.mesherService = new MesherService();

		this.menuManager = MenuManager.instance;
		//this.controlsManager = new GameControlsManager(ThreeManager.camera);

		this.menuManager.initializeAndLoadFromStorageAllMenus();

		this.prevFrameTime = performance.now();
		this.loop();
		GameManager._isInitialized = true;

		// Wywołanie wszystkich zarejestrowanych callbacków onInitialize
		GameManager.onInitializeCallbacks.forEach((cb) => cb());
		GameManager.onInitializeCallbacks = []; // czyszczenie

		return () => {
			this.playerManager.dispose();
			ThreeManager.destroy();
			WorldManager.chunkManager.disposeAll();
		};
	}

	public static async initialize(gameCanvas: HTMLCanvasElement): Promise<() => void> {
		if (!GameManager.instance) {
			new GameManager(gameCanvas);
		}
		return await GameManager.instance.initializeAsync();
	}
}
