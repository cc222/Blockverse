import { GameManager } from '../GameManger';
import { BaseManager } from './BaseManager';

export class ChatManager extends BaseManager {
	messages: string[] = $state([]);
	isEnabled: boolean = $state(false);

	constructor() {
		super();
	}

	addMessage(text: string) {
		this.messages.push(text);
	}

	sendMessage(text: string) {
		GameManager.instance.gameServer.sendChatMessage(GameManager.instance.myPlayerId, text);
	}
}
