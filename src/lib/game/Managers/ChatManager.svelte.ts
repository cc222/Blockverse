import { GameManager } from '../GameManger';
import { GameServer } from '../server/GameServer';
import { BaseManager } from './BaseManager';

export class ChatManager extends BaseManager {
	messages: string[] = $state([]);
	isEnabled: boolean = $state(false);

	constructor(private gameServer: GameServer) {
		super();
		ChatManager.afterInitialization(() => {
			this.isEnabled = true;
		});
		ChatManager.onDestroy(() => {
			this.isEnabled = false;
		});
	}

	addMessage(text: string) {
		this.messages.push(text);
	}

	sendMessage(text: string) {
		this.gameServer.sendChatMessage(GameManager.instance.myPlayerId, text);
	}
}
