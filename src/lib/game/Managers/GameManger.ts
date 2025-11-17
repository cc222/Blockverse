import { GameServer } from '../server/GameServer';
import { LocalTransport } from '../server/Transport/LocalTransport';
import { Transport, type GameServerProxy } from '../server/Transport/Transport';
import { MesherService } from '../world/chunk/MesherService';
import { WorldManager } from '../world/WorldManager';
import { BaseManager } from './BaseManager';
import { ChatManager } from './ChatManager.svelte';
import type { ControlsManager } from './ControlsManager';
import { GameControlsManager } from './GameControlsManager';
import { PhysicsManager } from './PhysicsManager';
import { PlayerManager } from './PlayerManager';
import { StatsOverlayManager } from './StatsOverlayManager';
import { ThreeManager } from './ThreeManager';

export class GameManager extends BaseManager {
	statsOverlayManager!: StatsOverlayManager;
	chatManager!: ChatManager;
	playerManager!: PlayerManager;
	gameControlsManager!: GameControlsManager;
	physicsManager!: PhysicsManager;

	gameServer: GameServerProxy;
	static mesherService: MesherService;

	prevFrameTime: number;

	private animationFrameId: number | null = null;

	public constructor(
		public playerId: string,
		public gameCanvas: HTMLCanvasElement,
		private threeManager: ThreeManager,
		private controlsManager: ControlsManager
	) {
		super();
		this.prevFrameTime = performance.now();
		GameManager.mesherService = new MesherService();
		const transportLayer = new LocalTransport(new GameServer());
		const localGame = new GameServer();
		this.gameServer = Transport.createGameProxy(transportLayer, localGame);
		this.gameServer.addPlayer.reliable(this.playerId, transportLayer);
	}

	protected async onInitialize(): Promise<void> {
		this.threeManager.setupSceneForGame();
		this.statsOverlayManager = await StatsOverlayManager.getInstance();
		this.chatManager = await ChatManager.getInstance(this);
		this.physicsManager = await PhysicsManager.getInstance();
		this.gameControlsManager = new GameControlsManager(
			this,
			this.controlsManager,
			this.physicsManager,
			this.threeManager.camera
		);
		this.playerManager = await PlayerManager.getInstance(
			this.threeManager,
			this.gameControlsManager
		);
		WorldManager.init(this.threeManager);
		this.startLoop();
	}

	protected async onDestroy(): Promise<void> {
		this.stopLoop();
		this.playerManager.dispose();
		WorldManager.chunkManager.disposeAll();
		ChatManager.destroy();
	}

	private startLoop(): void {
		if (this.animationFrameId !== null) return;
		this.loop();
	}

	private stopLoop(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	private loop = () => {
		this.animationFrameId = requestAnimationFrame(this.loop);
		const now = performance.now();
		const delta = (now - this.prevFrameTime) / 1000;
		this.prevFrameTime = now;
		this.statsOverlayManager.beginStatsFrame();
		this.playerManager.update(delta);
		WorldManager.update(this.threeManager);
		this.threeManager.render();
		this.statsOverlayManager.endStatsFrame();
	};
}
