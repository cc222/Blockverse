import { MenuManager } from '$lib/components/menus/MenuManager.svelte';
import { ChatManager } from './ChatManager.svelte';
import { PlayerManager } from './PlayerManager';
import { GameServer } from './server/GameServer';
import { LocalTransport } from './server/Transport/LocalTransport';
import { Transport } from './server/Transport/Transport';
import { StatsOverlayManager } from './StatsOverlayManager';
import { createTextureAtlas } from './textures/textureAtlas';
import { ThreeManager } from './ThreeManager';
import { MesherService } from './world/chunk/MesherService';
import { WorldManager } from './world/WorldManager';

export class GameManager {
	public static instance: GameManager;
	private static _isInitialized: boolean = false;

	//controlsManager!: GameControlsManager;
	gameServer!: GameServer;
	myPlayerId: string;
	statsOverlayManager!: StatsOverlayManager;
	prevFrameTime!: number;
	gameCanvas!: HTMLCanvasElement;
	mesherService!: MesherService;
	menuManager!: MenuManager;
	playerManager!: PlayerManager;
	chatManager!: ChatManager;
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
		this.chatManager = new ChatManager();
		const transportLayer = new LocalTransport(new GameServer());
		this.gameServer = Transport.createGameProxy(transportLayer);
		this.gameServer.addPlayer(this.myPlayerId, transportLayer);
		this.gameCanvas = canvas;
		GameManager.instance = this;

		window.addEventListener('resize', this.onResize);
	}

	private loop = () => {
		requestAnimationFrame(this.loop);
		const now = performance.now();
		const delta = (now - this.prevFrameTime) / 1000;
		this.prevFrameTime = now;

		this.statsOverlayManager.beginStatsFrame();
		this.playerManager.update(delta);
		WorldManager.update();
		ThreeManager.render();
		this.statsOverlayManager.endStatsFrame();
	};

	private onResize = () => {
		const { camera, renderer } = ThreeManager;
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	};

	private async initializeAsync(): Promise<() => void> {
		await createTextureAtlas();
		this.mesherService = new MesherService();
		ThreeManager.init(this.gameCanvas);
		WorldManager.init();

		this.menuManager = MenuManager.instance;
		this.playerManager = new PlayerManager();
		//this.controlsManager = new GameControlsManager(ThreeManager.camera);
		this.statsOverlayManager = new StatsOverlayManager();

		this.menuManager.initializeAndLoadFromStorageAllMenus();

		this.prevFrameTime = performance.now();
		this.loop();
		GameManager._isInitialized = true;

		// Wywołanie wszystkich zarejestrowanych callbacków onInitialize
		GameManager.onInitializeCallbacks.forEach((cb) => cb());
		GameManager.onInitializeCallbacks = []; // czyszczenie

		return () => {
			window.removeEventListener('resize', this.onResize);
			this.playerManager.dispose();
			ThreeManager.renderer.dispose();
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
