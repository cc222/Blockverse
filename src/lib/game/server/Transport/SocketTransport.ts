import type { RpcTransport } from './RpcTransport';

export class SocketTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;

	constructor(private socket: unknown) {
		//@ts-expect-error fix
		socket.on('rpc', ({ method, args }: { method: string; args: unknown[] }) => {
			this.onReceive?.(method, args);
		});
	}

	call(method: string, args: unknown[]) {
		//@ts-expect-error fix
		this.socket.emit('rpc', { method, args });
	}
}
