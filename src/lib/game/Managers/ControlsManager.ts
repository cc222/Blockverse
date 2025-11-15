/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from 'three';
import { BaseManager } from './BaseManager';
import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';

type GameControlEventName =
	| 'unLock'
	| 'lock'
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

type GameControlsManagerEvents = {
	[K in GameControlEventName]: { type: K };
};

export class ControlsManager extends BaseManager {
	private _dispatcher = new THREE.EventDispatcher();

	// Publiczne API typowane
	addEventListener<K extends keyof GameControlsManagerEvents>(
		type: K,
		listener: (event: GameControlsManagerEvents[K]) => void
	) {
		// Delegacja do _dispatcher wymaga rzutowania
		(this._dispatcher.addEventListener as any)(type, listener);
	}

	hasEventListener<K extends keyof GameControlsManagerEvents>(
		type: K,
		listener: (event: GameControlsManagerEvents[K]) => void
	): boolean {
		return (this._dispatcher.hasEventListener as any)(type, listener);
	}

	removeEventListener<K extends keyof GameControlsManagerEvents>(
		type: K,
		listener: (event: GameControlsManagerEvents[K]) => void
	) {
		(this._dispatcher.removeEventListener as any)(type, listener);
	}

	dispatchEvent<K extends keyof GameControlsManagerEvents>(event: GameControlsManagerEvents[K]) {
		(this._dispatcher.dispatchEvent as any)(event);
	}

	constructor() {
		super();
		this.initListeners();
		ControlsManager.onDestroy(() => {
			this.dispose();
		});
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
		window.addEventListener('mousedown', (e) => this.onMouseDown(e));
		window.addEventListener('mouseup', (e) => this.onMouseUp(e));
	}

	private dispose() {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('mousedown', (e) => this.onMouseDown(e));
		window.removeEventListener('mouseup', (e) => this.onMouseUp(e));
	}
}
Object.assign(ControlsManager.prototype, THREE.EventDispatcher.prototype);
