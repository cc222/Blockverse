import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GameManager } from './GameManger';

interface GameControlsManagerEvents {
	unLock: { type: 'unLock' };
	lock: { type: 'lock' };
}

export class GameControlsManager extends THREE.EventDispatcher<GameControlsManagerEvents> {
	controls: PointerLockControls;
	velocity = new THREE.Vector3();
	direction = new THREE.Vector3();
	moveForward = false;
	moveBackward = false;
	moveLeft = false;
	moveRight = false;
	moveUp = false;
	moveDown = false;
	speed = 5.0;

	private _boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
	private _boundKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);
	private _boundOnExitPointerLock = () => {
		this.dispatchEvent({ type: 'unLock' });
	};
	EnterPointerLock = () => {
		this.controls.lock();
		this.dispatchEvent({ type: 'lock' });
	};

	constructor(camera: THREE.PerspectiveCamera) {
		super();
		this.controls = new PointerLockControls(camera, GameManager.instance.gameCanvas);
		this.initListeners();
	}

	private initListeners() {
		GameManager.instance.gameCanvas.addEventListener('click', this.EnterPointerLock);
		this.controls.addEventListener('unlock', this._boundOnExitPointerLock);

		window.addEventListener('keydown', this._boundKeyDown);
		window.addEventListener('keyup', this._boundKeyUp);
	}

	dispose() {
		GameManager.instance.gameCanvas.removeEventListener('click', this.EnterPointerLock);
		this.controls.removeEventListener('unlock', this._boundOnExitPointerLock);
		window.removeEventListener('keydown', this._boundKeyDown);
		window.removeEventListener('keyup', this._boundKeyUp);
	}

	private onKeyDown(e: KeyboardEvent) {
		switch (e.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.moveForward = true;
				break;
			case 'ArrowDown':
			case 'KeyS':
				this.moveBackward = true;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				this.moveLeft = true;
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.moveRight = true;
				break;
			case 'Space':
				this.moveUp = true;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
				this.moveDown = true;
				break;
		}
	}

	private onKeyUp(e: KeyboardEvent) {
		switch (e.code) {
			case 'ArrowUp':
			case 'KeyW':
				this.moveForward = false;
				break;
			case 'ArrowDown':
			case 'KeyS':
				this.moveBackward = false;
				break;
			case 'ArrowLeft':
			case 'KeyA':
				this.moveLeft = false;
				break;
			case 'ArrowRight':
			case 'KeyD':
				this.moveRight = false;
				break;
			case 'Space':
				this.moveUp = false;
				break;
			case 'ShiftLeft':
			case 'ShiftRight':
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

		this.direction.normalize();

		const moveSpeed = this.speed * delta;
		this.controls.moveRight(this.direction.x * moveSpeed);
		this.controls.moveForward(this.direction.z * moveSpeed);
		this.controls.object.position.y += this.direction.y * moveSpeed;
	}
}
