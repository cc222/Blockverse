import type { GameServer } from '../GameServer';
import type { RpcTransport } from './RpcTransport';

export class LocalTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;

	constructor(private game: GameServer) {}

	callReliable(method: string, args: unknown[]): void {
		const fn = this.game[method as keyof GameServer];
		if (typeof fn === 'function') {
			(fn as (...args: unknown[]) => void).apply(this.game, args);
		}
	}

	callUnreliable(method: string, args: unknown[]): void {
		// W lokalnym transporcie nie ma różnicy
		this.callReliable(method, args);
	}

	trigger(method: string, args: unknown[]): void {
		this.onReceive?.(method, args);
	}
}
