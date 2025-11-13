import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GameManager } from './GameManger';
import { PauseMenu } from '$lib/components/menus/PauseMenu';
import { Debug } from '$lib/debug/Debug';
import { DebugType } from '$lib/debug/DebugType';
import { DebugLevel } from '$lib/debug/DebugLevel';
import { PhysicsManager } from './PhysicsManager';

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
	| 'forwardKeyDown'
	| 'backwardKeyDown'
	| 'rightKeyDown'
	| 'leftKeyDown'
	| 'upKeyDown'
	| 'downKeyDown'
	| 'escapeKeyDown'
	| 'enterKeyDown';

type GameControlsManagerEvents = {
	[K in GameControlEventName]: { type: K };
};

export class GameControlsManager extends THREE.EventDispatcher<GameControlsManagerEvents> {
	controls: PointerLockControls;
	//velocity = new THREE.Vector3();
	direction = new THREE.Vector3();
	moveForward = false;
	moveBackward = false;
	moveLeft = false;
	moveRight = false;
	moveUp = false;
	moveDown = false;

	// Physics-based movement
	speed = 5.0; // Walking speed (reduced from 20.0)
	sprintSpeed = 8.0; // Sprinting speed
	isSprinting = false;

	private physicsManager: PhysicsManager;
	private notOpenPauseMenuOnPointerLockUnlock: boolean = false;

	private _boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
	private _boundKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);
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

	constructor(camera: THREE.PerspectiveCamera) {
		super();
		this.controls = new PointerLockControls(camera, GameManager.instance.gameCanvas);
		this.physicsManager = new PhysicsManager();
		this.initListeners();
	}

	private initListeners() {
		GameManager.instance.gameCanvas.addEventListener('click', this.enterPointerLock);
		this.controls.addEventListener('unlock', this._boundOnExitPointerLock);

		window.addEventListener('keydown', this._boundKeyDown);
		window.addEventListener('keyup', this._boundKeyUp);
	}

	dispose() {
		GameManager.instance.gameCanvas.removeEventListener('click', this.enterPointerLock);
		this.controls.removeEventListener('unlock', this._boundOnExitPointerLock);
		window.removeEventListener('keydown', this._boundKeyDown);
		window.removeEventListener('keyup', this._boundKeyUp);
	}

	private onKeyDown(e: KeyboardEvent) {
		switch (e.code) {
			case 'Enter':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'enterKeyDown' });
				break;
			case 'Escape':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'escapeKeyDown' });
				break;
			case 'ArrowUp':
			case 'KeyW':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'forwardKeyDown' });
				this.moveForward = true;
				break;
			case 'ArrowDown':
			case 'KeyS':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'backwardKeyDown' });
				this.moveBackward = true;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'leftKeyDown' });
				this.moveLeft = true;
				break;
			case 'ArrowRight':
			case 'KeyD':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'rightKeyDown' });
				this.moveRight = true;
				break;
			case 'Space':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'upKeyDown' });
				this.moveUp = true;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'downKeyDown' });
				this.moveDown = true;
				break;
		}
	}

	private onKeyUp(e: KeyboardEvent) {
		switch (e.code) {
			case 'Enter':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'enterKeyUp' });
				break;
			case 'Escape':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'escapeKeyUp' });
				break;
			case 'ArrowUp':
			case 'KeyW':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'forwardKeyUp' });
				this.moveForward = false;
				break;
			case 'ArrowDown':
			case 'KeyS':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'backwardKeyUp' });
				this.moveBackward = false;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'leftKeyUp' });
				this.moveLeft = false;
				break;
			case 'ArrowRight':
			case 'KeyD':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'rightKeyUp' });
				this.moveRight = false;
				break;
			case 'Space':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'upKeyUp' });
				this.moveUp = false;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				if (!this.controls.isLocked) this.dispatchEvent({ type: 'downKeyUp' });
				this.moveDown = false;
				break;
		}
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
