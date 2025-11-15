import type { GameServer } from '../GameServer';
import type { RpcTransport } from './RpcTransport';

export class LocalTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;
	constructor(private game: GameServer) {}

	call(method: string, args: unknown[]) {
		//@ts-expect-error fix
		this.game[method](...args);
	}

	trigger(method: string, args: unknown[]) {
		this.onReceive?.(method, args);
	}
}
