import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';
import { BaseManagerAndEventEmiter } from './BaseManagerAndEventEmiter';

type EventsNames =
	| 'forwardKeyUp'
	| 'backwardKeyUp'
	| 'rightKeyUp'
	| 'leftKeyUp'
	| 'upKeyUp'
	| 'downKeyUp'
	| 'escapeKeyUp'
	| 'enterKeyUp'
	| 'attackKeyUp'
	| 'interactKeyUp'
	| 'forwardKeyDown'
	| 'backwardKeyDown'
	| 'rightKeyDown'
	| 'leftKeyDown'
	| 'upKeyDown'
	| 'downKeyDown'
	| 'escapeKeyDown'
	| 'enterKeyDown'
	| 'attackKeyDown'
	| 'interactKeyDown';

type Events = {
	[K in EventsNames]: { type: K };
};

export class ControlsManager extends BaseManagerAndEventEmiter<Events> {
	constructor() {
		super();
		this.initListeners();
	}

	protected async onDestroy(): Promise<void> {
		this.removeListeners();
	}

	private onMouseDown = (e: MouseEvent) => {
		if (e.button === 0) {
			// Lewy przycisk myszy — np. strzelanie
			Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Left mouse button clicked');
			this.dispatchEvent({ type: 'attackKeyDown' });
		} else if (e.button === 2) {
			// Prawy przycisk myszy — np. celowanie / blokowanie
			Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Right mouse button clicked');
			this.dispatchEvent({ type: 'interactKeyDown' });
		}
	};

	private onMouseUp = (e: MouseEvent) => {
		if (e.button === 0) {
			// Lewy przycisk myszy — np. strzelanie
			Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Left mouse button clicked');
			this.dispatchEvent({ type: 'attackKeyUp' });
		} else if (e.button === 2) {
			// Prawy przycisk myszy — np. celowanie / blokowanie
			Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Right mouse button clicked');
			this.dispatchEvent({ type: 'interactKeyUp' });
		}
	};

	private onKeyDown = (e: KeyboardEvent) => {
		switch (e.code) {
			case 'Enter':
				this.dispatchEvent({ type: 'enterKeyDown' });
				break;
			case 'Escape':
				this.dispatchEvent({ type: 'escapeKeyDown' });
				break;
			case 'ArrowUp':
			case 'KeyW':
				this.dispatchEvent({ type: 'forwardKeyDown' });
				break;
			case 'ArrowDown':
			case 'KeyS':
				this.dispatchEvent({ type: 'backwardKeyDown' });
				break;
			case 'ArrowLeft':
			case 'KeyA':
				this.dispatchEvent({ type: 'leftKeyDown' });
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.dispatchEvent({ type: 'rightKeyDown' });
				break;
			case 'Space':
				this.dispatchEvent({ type: 'upKeyDown' });
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.dispatchEvent({ type: 'downKeyDown' });
				break;
		}
	};

	private onKeyUp = (e: KeyboardEvent) => {
		switch (e.code) {
			case 'Enter':
				this.dispatchEvent({ type: 'enterKeyUp' });
				break;
			case 'Escape':
				this.dispatchEvent({ type: 'escapeKeyUp' });
				break;
			case 'ArrowUp':
			case 'KeyW':
				this.dispatchEvent({ type: 'forwardKeyUp' });
				break;
			case 'ArrowDown':
			case 'KeyS':
				this.dispatchEvent({ type: 'backwardKeyUp' });
				break;
			case 'ArrowLeft':
			case 'KeyA':
				this.dispatchEvent({ type: 'leftKeyUp' });
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.dispatchEvent({ type: 'rightKeyUp' });
				break;
			case 'Space':
				this.dispatchEvent({ type: 'upKeyUp' });
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.dispatchEvent({ type: 'downKeyUp' });
				break;
		}
	};

	private initListeners() {
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('mousedown', this.onMouseDown);
		window.addEventListener('mouseup', this.onMouseUp);
	}

	private removeListeners() {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('mousedown', this.onMouseDown);
		window.removeEventListener('mouseup', this.onMouseUp);
	}
}
