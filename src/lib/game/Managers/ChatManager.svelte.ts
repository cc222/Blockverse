import { BaseManager } from './BaseManager';
import { GameManager } from './GameManger';

export class ChatManager extends BaseManager {
	messages: string[] = $state([]);
	isEnabled: boolean = $state(false);
	gameManager!: GameManager;

	constructor() {
		super();
		ChatManager.afterInitialization(() => {
			this.isEnabled = true;
		});
		ChatManager.onDestroy(() => {
			this.isEnabled = false;
		});
		GameManager.afterInitialization((instance) => {
			this.gameManager = instance;
		});
	}

	addMessage(text: string) {
		this.messages.push(text);
	}

	sendMessage(text: string) {
		this.gameManager.gameServer.sendChatMessage.reliable(this.gameManager.playerId, text);
	}
}
