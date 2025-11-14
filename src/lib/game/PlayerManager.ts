import * as THREE from 'three';
import { GameControlsManager } from './GameControlsManager';
import { ThreeManager } from './ThreeManager';
import { WorldManager } from './world/WorldManager';

export class PlayerManager {
	controls: GameControlsManager;
	private camera: THREE.Camera;
	private highlightMesh: THREE.Mesh;

	private attackCoolDown = 0.3;
	private interactionCoolDown = 0.3;
	private lastAttackTime = 0;
	private lastInteractTime = 0;

	constructor() {
		this.controls = new GameControlsManager(ThreeManager.camera);
		this.camera = ThreeManager.camera;

		// Wireframe podświetlenia
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			wireframe: true,
			transparent: true,
			opacity: 0.8
		});
		this.highlightMesh = new THREE.Mesh(geometry, material);
		this.highlightMesh.visible = false;
		ThreeManager.scene.add(this.highlightMesh);
	}

	public update(delta: number) {
		// Aktualizacja kontroli ruchu
		this.controls.update(delta);

		// Raycast do podświetlania
		const lookDir = new THREE.Vector3();
		this.camera.getWorldDirection(lookDir);
		const hit = raycastVoxel(this.camera.position, lookDir);

		if (hit.found) {
			this.highlightMesh.position.copy(hit.pos).addScalar(0.5); // środek bloku
			this.highlightMesh.visible = true;
		} else {
			this.highlightMesh.visible = false;
		}

		if (this.controls.attacking) {
			const now = performance.now() / 1000;
			if (now - this.lastAttackTime >= this.attackCoolDown) {
				this.attack(hit);
				this.lastAttackTime = now;
			}
		}
		if (this.controls.interacting) {
			const now = performance.now() / 1000;
			if (now - this.lastInteractTime >= this.interactionCoolDown) {
				this.interact(hit);
				this.lastInteractTime = now;
			}
		}
	}

	private interact(hit: HitResult) {
		const placePos = hit.pos.clone().add(hit.normal);

		// Sprawdzenie kolizji z graczem
		const playerPos = this.getPosition();
		const playerHalfWidth = 0.3;
		const playerHeight = 2.0;

		const collidesWithPlayer =
			placePos.x + 1 > playerPos.x - playerHalfWidth &&
			placePos.x < playerPos.x + playerHalfWidth &&
			placePos.y + 1 > playerPos.y &&
			placePos.y < playerPos.y + playerHeight &&
			placePos.z + 1 > playerPos.z - playerHalfWidth &&
			placePos.z < playerPos.z + playerHalfWidth;

		if (!collidesWithPlayer) {
			const placePos = hit.pos.clone().add(hit.normal);
			WorldManager.chunkManager.setBlockAt(placePos.x, placePos.y, placePos.z, 1);
		}
	}

	private attack(hit: HitResult) {
		WorldManager.chunkManager.setBlockAt(hit.pos.x, hit.pos.y, hit.pos.z, 0);
	}

	public getPosition(): THREE.Vector3 {
		return this.camera.position.clone();
	}

	public setPosition(x: number, y: number, z: number) {
		this.camera.position.set(x, y, z);
	}

	public dispose() {
		this.controls.dispose();
	}
}

export type HitResult = {
	pos: THREE.Vector3; // pozycja trafionego bloku
	normal: THREE.Vector3; // z której strony padł strzał (np. (1,0,0) dla +X)
	found: boolean;
};

export function raycastVoxel(
	playerPos: THREE.Vector3,
	lookDir: THREE.Vector3,
	maxDistance = 5
): HitResult {
	let x = Math.floor(playerPos.x);
	let y = Math.floor(playerPos.y);
	let z = Math.floor(playerPos.z);

	const stepX = lookDir.x > 0 ? 1 : -1;
	const stepY = lookDir.y > 0 ? 1 : -1;
	const stepZ = lookDir.z > 0 ? 1 : -1;

	const tDeltaX = lookDir.x !== 0 ? Math.abs(1 / lookDir.x) : Infinity;
	const tDeltaY = lookDir.y !== 0 ? Math.abs(1 / lookDir.y) : Infinity;
	const tDeltaZ = lookDir.z !== 0 ? Math.abs(1 / lookDir.z) : Infinity;

	let tMaxX =
		lookDir.x !== 0 ? (stepX > 0 ? x + 1 - playerPos.x : playerPos.x - x) * tDeltaX : Infinity;
	let tMaxY =
		lookDir.y !== 0 ? (stepY > 0 ? y + 1 - playerPos.y : playerPos.y - y) * tDeltaY : Infinity;
	let tMaxZ =
		lookDir.z !== 0 ? (stepZ > 0 ? z + 1 - playerPos.z : playerPos.z - z) * tDeltaZ : Infinity;

	const hitNormal = new THREE.Vector3();

	let traveled = 0;
	while (traveled < maxDistance) {
		const blockId = WorldManager.chunkManager.getBlockAt(x, y, z);
		if (blockId > 0) {
			// Trafiono blok
			return { pos: new THREE.Vector3(x, y, z), normal: hitNormal.clone(), found: true };
		}

		// Która oś „wygrywa”?
		if (tMaxX < tMaxY && tMaxX < tMaxZ) {
			x += stepX;
			hitNormal.set(-stepX, 0, 0); // normal wskazuje stronę trafionego bloku
			traveled = tMaxX;
			tMaxX += tDeltaX;
		} else if (tMaxY < tMaxZ) {
			y += stepY;
			hitNormal.set(0, -stepY, 0);
			traveled = tMaxY;
			tMaxY += tDeltaY;
		} else {
			z += stepZ;
			hitNormal.set(0, 0, -stepZ);
			traveled = tMaxZ;
			tMaxZ += tDeltaZ;
		}
	}

	return { pos: new THREE.Vector3(), normal: new THREE.Vector3(), found: false };
}
