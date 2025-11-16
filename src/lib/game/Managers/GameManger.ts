import { PlayerManager } from '../PlayerManager';
import { GameServer } from '../server/GameServer';
import { LocalTransport } from '../server/Transport/LocalTransport';
import { Transport, type GameServerProxy } from '../server/Transport/Transport';
import { MesherService } from '../world/chunk/MesherService';
import { WorldManager } from '../world/WorldManager';
import { BaseManager } from './BaseManager';
import { ChatManager } from './ChatManager.svelte';
import { StatsOverlayManager } from './StatsOverlayManager';
import { ThreeManager } from './ThreeManager';

export class GameManager extends BaseManager {
	threeManager!: ThreeManager;
	statsOverlayManager!: StatsOverlayManager;
	chatManager!: ChatManager;
	playerManager!: PlayerManager;

	gameServer: GameServerProxy;
	static mesherService: MesherService;

	prevFrameTime: number;

	private animationFrameId: number | null = null;

	public constructor(
		public playerId: string,
		public gameCanvas: HTMLCanvasElement
	) {
		super();
		this.prevFrameTime = performance.now();
		GameManager.mesherService = new MesherService();
		const transportLayer = new LocalTransport(new GameServer());
		const localGame = new GameServer();
		this.gameServer = Transport.createGameProxy(transportLayer, localGame);
		this.gameServer.addPlayer.reliable(this.playerId, transportLayer);
		GameManager.afterInitialization(async () => {
			this.threeManager = await ThreeManager.getInstance(this.gameCanvas);
			this.statsOverlayManager = await StatsOverlayManager.getInstance();
			this.chatManager = await ChatManager.getInstance();
			this.playerManager = new PlayerManager(this, this.threeManager);
			WorldManager.init(this.threeManager);
			this.startLoop();
		});
		GameManager.onDestroy(async () => {
			this.stopLoop();
			this.playerManager.dispose();
			ThreeManager.destroy();
			WorldManager.chunkManager.disposeAll();
			ChatManager.destroy();
		});
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
