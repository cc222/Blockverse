import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { PauseMenu } from '$lib/components/menus/PauseMenu';
import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';
import { BaseManagerAndEventEmitter } from './BaseManagerAndEventEmiter';
import type { GameManager } from './GameManger';
import type { PhysicsManager } from './PhysicsManager';
import type { ControlsManager } from './ControlsManager';

type EventsNames = 'lock' | 'unLock';

type Events = {
	[K in EventsNames]: { type: K };
};

export class GameControlsManager extends BaseManagerAndEventEmitter<Events> {
	controls: PointerLockControls;
	//velocity = new THREE.Vector3();
	direction = new THREE.Vector3();
	moveForward = false;
	moveBackward = false;
	moveLeft = false;
	moveRight = false;
	moveUp = false;
	moveDown = false;
	attacking = false;
	interacting = false;

	// Physics-based movement
	speed = 5.0; // Walking speed (reduced from 20.0)
	sprintSpeed = 8.0; // Sprinting speed
	isSprinting = false;

	private notOpenPauseMenuOnPointerLockUnlock: boolean = false;
	private controlListeners: { type: string; fn: (e: unknown) => void }[] = [];

	private _boundOnExitPointerLock = () => {
		this.dispatchEvent({ type: 'unLock' });
		Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Exiting pointer lock ');
		if (!this.notOpenPauseMenuOnPointerLockUnlock) {
			PauseMenu.instance.openMenu();
		} else {
			this.notOpenPauseMenuOnPointerLockUnlock = false;
		}
	};
	exitPointerLock() {
		this.notOpenPauseMenuOnPointerLockUnlock = true;
		this.controls.unlock();
	}
	enterPointerLock = () => {
		this.dispatchEvent({ type: 'lock' });
		Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Entering pointer lock');
		this.controls.lock();
	};

	constructor(
		private gameManager: GameManager,
		private controlsManager: ControlsManager,
		private physicsManager: PhysicsManager,
		camera: THREE.PerspectiveCamera
	) {
		super();
		this.controls = new PointerLockControls(camera, gameManager.gameCanvas);
		this.initListeners();
		this.bindControlEvents();
	}

	private bindControlEvents() {
		const mapEventToState = (eventType: string, state: boolean) => {
			switch (eventType) {
				case 'forwardKeyDown':
				case 'forwardKeyUp':
					this.moveForward = state;
					break;
				case 'backwardKeyDown':
				case 'backwardKeyUp':
					this.moveBackward = state;
					break;
				case 'leftKeyDown':
				case 'leftKeyUp':
					this.moveLeft = state;
					break;
				case 'rightKeyDown':
				case 'rightKeyUp':
					this.moveRight = state;
					break;
				case 'upKeyDown':
				case 'upKeyUp':
					this.moveUp = state;
					break;
				case 'downKeyDown':
				case 'downKeyUp':
					this.moveDown = state;
					break;
				case 'attackKeyDown':
				case 'attackKeyUp':
					this.attacking = state;
					break;
				case 'interactKeyDown':
				case 'interactKeyUp':
					this.interacting = state;
					break;
			}
		};

		const events = [
			'forwardKeyDown',
			'forwardKeyUp',
			'backwardKeyDown',
			'backwardKeyUp',
			'leftKeyDown',
			'leftKeyUp',
			'rightKeyDown',
			'rightKeyUp',
			'upKeyDown',
			'upKeyUp',
			'downKeyDown',
			'downKeyUp',
			'attackKeyDown',
			'attackKeyUp',
			'interactKeyDown',
			'interactKeyUp'
		];

		for (const eventType of events) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const fn = (e: any) => mapEventToState(e.type, e.type.endsWith('Down'));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.controlsManager.addEventListener(eventType as any, fn);
			this.controlListeners.push({ type: eventType, fn });
		}
	}

	private initListeners() {
		this.gameManager.gameCanvas.addEventListener('click', this.enterPointerLock);
		this.controls.addEventListener('unlock', this._boundOnExitPointerLock);
	}

	dispose() {
		this.gameManager.gameCanvas.removeEventListener('click', this.enterPointerLock);
		this.controls.removeEventListener('unlock', this._boundOnExitPointerLock);
		for (const listener of this.controlListeners) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.controlsManager.removeEventListener(listener.type as any, listener.fn);
		}
		this.controlListeners = [];
	}

	update(delta: number) {
		if (!this.controls.isLocked) return;

		this.direction.set(0, 0, 0);
		if (this.moveForward) this.direction.z += 1;
		if (this.moveBackward) this.direction.z -= 1;
		if (this.moveLeft) this.direction.x -= 1;
		if (this.moveRight) this.direction.x += 1;
		if (this.moveUp) this.direction.y += 1;
		if (this.moveDown) this.direction.y -= 1;

		if (this.direction.length() > 0) {
			this.direction.normalize();
		}

		// Transform direction to world space
		const camera = this.controls.object;
		const forward = new THREE.Vector3();
		camera.getWorldDirection(forward);
		forward.y = 0; // Keep movement horizontal
		forward.normalize();

		const right = new THREE.Vector3();
		right.crossVectors(forward, camera.up).normalize();

		const worldDirection = new THREE.Vector3();
		worldDirection.addScaledVector(right, this.direction.x);
		worldDirection.addScaledVector(forward, this.direction.z);

		// Apply current speed (sprint or walk)
		const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;

		// Update physics with horizontal movement direction
		if (this.moveUp) {
			this.physicsManager.jump();
		}
		this.physicsManager.update(delta, camera.position, worldDirection, currentSpeed);

		// Debug info
		const physicsState = this.physicsManager.getState();
		if (delta > 0) {
			Debug.log(DebugType.CONTROLS, DebugLevel.DEBUG, 'Player physics', {
				position: `${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`,
				velocity: `${physicsState.velocity.y.toFixed(2)}`,
				grounded: physicsState.isGrounded,
				sprinting: this.isSprinting
			});
		}
	}

	public getPosition(): THREE.Vector3 {
		return this.controls.object.position;
	}

	public setPosition(x: number, y: number, z: number): void {
		this.controls.object.position.set(x, y, z);
		this.physicsManager.reset();
	}
}
