import { GameManager } from '../GameManger';
import type { RpcTransport } from './Transport/RpcTransport';

export class GameServer {
	players: Map<string, RpcTransport> = new Map();

	broadcast(exceptPlayerId: string | null, method: string, args: unknown[]) {
		for (const [id, transport] of this.players) {
			if (id !== exceptPlayerId) {
				transport.call(method, args);
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
		GameManager.instance.chatManager.addMessage(`${playerId} send ${message}`);
	}

	move(playerId: string, direction: string) {
		console.log(`${playerId} moves ${direction}`);
		// aktualizuj stan gry
	}

	attack(playerId: string, targetId: string) {
		console.log(`${playerId} attacks ${targetId}`);
		// logika ataku
	}

	pickupItem(playerId: string, itemId: string) {
		console.log(`${playerId} picks up ${itemId}`);
		// logika podnoszenia itemu
	}
}

//dedicated game server
// import { Server } from 'socket.io';
// import { GameServer } from './GameServer';
// import { ServerSideTransport } from './transports/SocketTransport';

// const io = new Server(3000);
// const game = new GameServer();

// io.on('connection', (socket) => {
//   const playerId = socket.id;
//   const transport = new ServerSideTransport(socket);

//   game.addPlayer(playerId, transport);

//   // transport odbiera RPC od klienta i wywołuje metody serwera
//   transport.onReceive = (method, args) => {
//     // @ts-ignore
//     if (typeof game[method] === 'function') {
//       // wywołanie metody np. move/attack/pickupItem
//       // playerId przekazujemy jako pierwszy argument, jeśli nie jest w args
//       game[method](playerId, ...args);
//     }
//   };

//   socket.on('disconnect', () => {
//     game.removePlayer(playerId);
//   });
// });
