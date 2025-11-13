import { MenuManager } from '$lib/components/menus/MenuManager.svelte';
import { GameControlsManager } from './GameControlsManager';
import { StatsOverlayManager } from './StatsOverlayManager';
import { createTextureAtlas } from './textures/textureAtlas';
import { ThreeManager } from './ThreeManager';
import { MesherService } from './world/chunk/MesherService';
import { WorldManager } from './world/WorldManager';

export class GameManager {
	public static instance: GameManager;

	controlsManager!: GameControlsManager;
	statsOverlayManager!: StatsOverlayManager;
	prevFrameTime!: number;
	gameCanvas!: HTMLCanvasElement;
	mesherService!: MesherService;
	menuManager!: MenuManager;
	dispose: () => void = () => {};

	private constructor(canvas: HTMLCanvasElement) {
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
		this.controlsManager.update(delta);
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
		this.controlsManager = new GameControlsManager(ThreeManager.camera);
		this.statsOverlayManager = new StatsOverlayManager();

		this.menuManager.initializeAndLoadFromStorageAllMenus();

		this.prevFrameTime = performance.now();
		this.loop();

		return () => {
			window.removeEventListener('resize', this.onResize);
			this.controlsManager.dispose();
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
