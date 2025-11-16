import type { RpcTransport } from './RpcTransport';

export class ServerSideTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(private socket: any) {
		socket.on('rpc', ({ method, args }: { method: string; args: unknown[] }) => {
			this.onReceive?.(method, args);
		});
	}
	callReliable(method: string, args: unknown[]): void {
		this.socket.emit('rpc', { method, args });
	}
	callUnreliable(method: string, args: unknown[]): void {
		this.socket.emit('rpc', { method, args });
	}
}
