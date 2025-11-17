import { BaseManager } from './BaseManager';
import { GameManager } from './GameManger';

export class ChatManager extends BaseManager {
	messages: string[] = $state<string[]>([]);
	isEnabled: boolean = $state(false);

	constructor(private gameManager: GameManager) {
		super();
		this.isEnabled = true;
	}

	protected async onDestroy(): Promise<void> {
		this.isEnabled = false;
	}

	addMessage(text: string) {
		this.messages = [...this.messages, text];
	}

	sendMessage(text: string) {
		this.gameManager.gameServer.sendChatMessage.reliable(this.gameManager.playerId, text);
	}
}
