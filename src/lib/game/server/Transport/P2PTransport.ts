import type { RpcTransport } from './RpcTransport';

export class P2PTransport implements RpcTransport {
	onReceive?: (method: string, args: unknown[]) => void;

	constructor(private dataChannel: RTCDataChannel) {
		this.dataChannel.onmessage = (event) => {
			try {
				const { method, args } = JSON.parse(event.data);
				this.onReceive?.(method, args);
			} catch (e) {
				console.error('Invalid P2P message', e);
			}
		};
	}

	call(method: string, args: unknown[]) {
		//@ts-expect-error fix
		this.channel.send(JSON.stringify({ method, args }));
	}
}
