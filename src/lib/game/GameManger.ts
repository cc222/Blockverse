import { GameControlsManager } from './GameControlsManager';
import { StatsOverlayManager } from './StatsOverlayManager';
import { createTextureAtlas } from './textures/textureAtlas';
import { createWorld } from './world/world';
import * as THREE from 'three';

export class GameManager {
	public static instance: GameManager;

	controlsManager!: GameControlsManager;
	statsOverlayManager!: StatsOverlayManager;
	renderer!: THREE.WebGLRenderer;
	camera!: THREE.PerspectiveCamera;
	scene!: THREE.Scene;
	prevFrameTime!: number;
	dispose: () => void = () => {};

	private constructor(gameCanvas: HTMLCanvasElement) {
		window.addEventListener('resize', this.handleResize);
		const { scene, camera, renderer } = createWorld(gameCanvas);
		this.scene = scene;
		this.camera = camera;
		this.renderer = renderer;
		this.controlsManager = new GameControlsManager(camera, renderer.domElement);
		this.statsOverlayManager = new StatsOverlayManager();
	}

	gameAnimationFrame = () => {
		requestAnimationFrame(this.gameAnimationFrame);
		const time = performance.now();
		const delta = (time - this.prevFrameTime) / 1000;
		this.prevFrameTime = time;
		this.statsOverlayManager.beginStatsFrame();
		GameManager.instance.controlsManager.update(delta);
		this.renderer.render(this.scene, this.camera);
		this.statsOverlayManager.endStatsFrame();
	};

	handleResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};

	private async initializeAsync(): Promise<() => void> {
		await createTextureAtlas();

		this.prevFrameTime = performance.now();
		this.gameAnimationFrame();

		this.dispose = () => {
			window.removeEventListener('resize', this.handleResize);
			// cleanup (svelte onDestroy also called)
			this.renderer.dispose();
		};
		return this.dispose;
	}

	public static async initialize(gameCanvas: HTMLCanvasElement): Promise<() => void> {
		if (!GameManager.instance) {
			GameManager.instance = new GameManager(gameCanvas);
			return await GameManager.instance.initializeAsync();
		}
		return () => {};
	}
}
