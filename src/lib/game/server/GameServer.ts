import { GameManager } from '../Managers/GameManger';
import type { RpcTransport } from './Transport/RpcTransport';

export class GameServer {
	players: Map<string, RpcTransport> = new Map();

	gameManager!: GameManager;

	constructor() {
		GameManager.afterInitialization((instance) => {
			this.gameManager = instance;
		});
	}

	broadcast(exceptPlayerId: string | null, method: string, args: unknown[], unreliable = false) {
		for (const [id, transport] of this.players) {
			if (id !== exceptPlayerId) {
				if (unreliable) {
					transport.callUnreliable(method, args);
				} else {
					transport.callReliable(method, args);
				}
			}
		}
	}

	addPlayer(playerId: string, transport: RpcTransport) {
		console.log('dodano gracza ', playerId);
		this.players.set(playerId, transport);
	}

	sendChatMessage(playerId: string, message: string) {
		console.log(`${playerId} send ${message}`);
		this.broadcast(null, 'receiveChatMessage', [playerId, message]);
	}

	receiveChatMessage(playerId: string, message: string) {
		console.log(`received ${playerId} send ${message}`);
		this.gameManager.chatManager.addMessage(`${playerId} send ${message}`);
	}

	move(playerId: string, direction: string) {
		console.log(`${playerId} moves ${direction}`);
		// Ruch można wysyłać unreliable
		// this.broadcast(playerId, 'updatePosition', [playerId, direction], true);
	}

	attack(playerId: string, targetId: string) {
		console.log(`${playerId} attacks ${targetId}`);
		// Atak powinien być reliable
	}

	pickupItem(playerId: string, itemId: string) {
		console.log(`${playerId} picks up ${itemId}`);
		// Podnoszenie itemu powinno być reliable
	}
}
