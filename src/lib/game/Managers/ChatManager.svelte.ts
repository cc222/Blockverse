import { BaseManager } from './BaseManager';
import type { GameManager } from './GameManger.svelte';

export class ChatManager extends BaseManager {
	messages: string[] = $state<string[]>([]);

	constructor(private gameManager: GameManager) {
		super();
		this.messages = [];
	}

	public async onDisable(): Promise<void> {
		this.messages = [];
	}

	addMessage(text: string) {
		this.messages = [...this.messages, text];
	}

	sendMessage(text: string) {
		this.gameManager.gameServer.sendChatMessage.reliable(this.gameManager.playerId, text);
	}
}
