import { GameManager } from './GameManger';

export class ChatManager {
	messages: string[] = $state([]);
	isEnabled: boolean = $state(false);

	constructor() {}

	addMessage(text: string) {
		this.messages.push(text);
	}

	sendMessage(text: string) {
		GameManager.instance.gameServer.sendChatMessage(GameManager.instance.myPlayerId, text);
	}
}
