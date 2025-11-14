import * as THREE from 'three';
import { WorldManager } from './world/WorldManager';

export class PhysicsManager {
	// Player physics properties
	private velocity = new THREE.Vector3();
	private readonly gravity = -25;
	private readonly jumpStrength = 8;
	private readonly terminalVelocity = -50;

	// Player collision box (relative to position)
	private readonly playerWidth = 0.6;
	private readonly playerHeight = 2;
	private readonly playerDepth = 0.6;

	private isGrounded = false;
	private canJump = true;

	constructor() {}

	/**
	 * Check if player's AABB collides with any solid blocks
	 */
	private checkCollision(position: THREE.Vector3, offset: THREE.Vector3): boolean {
		const testPos = position.clone().add(offset);

		// Player bounding box corners
		const minX = testPos.x - this.playerWidth / 2;
		const maxX = testPos.x + this.playerWidth / 2;
		const minY = testPos.y - this.playerHeight;
		const maxY = testPos.y + this.playerHeight;
		const minZ = testPos.z - this.playerDepth / 2;
		const maxZ = testPos.z + this.playerDepth / 2;

		// Check all blocks the player could collide with
		const checkMinX = Math.floor(minX);
		const checkMaxX = Math.floor(maxX);
		const checkMinY = Math.floor(minY);
		const checkMaxY = Math.floor(maxY);
		const checkMinZ = Math.floor(minZ);
		const checkMaxZ = Math.floor(maxZ);

		for (let x = checkMinX; x <= checkMaxX; x++) {
			for (let y = checkMinY; y <= checkMaxY; y++) {
				for (let z = checkMinZ; z <= checkMaxZ; z++) {
					const block = WorldManager.chunkManager.getBlockAt(x, y, z);
					if (block === -1) {
						return true;
					}
					if (block !== 0) {
						// Solid block
						// AABB collision check
						const blockMinX = x;
						const blockMaxX = x + 1;
						const blockMinY = y;
						const blockMaxY = y + 1;
						const blockMinZ = z;
						const blockMaxZ = z + 1;

						if (
							maxX > blockMinX &&
							minX < blockMaxX &&
							maxY > blockMinY &&
							minY < blockMaxY &&
							maxZ > blockMinZ &&
							minZ < blockMaxZ
						) {
							return true;
						}
					}
				}
			}
		}

		return false;
	}
	/**
	 * Apply gravity and handle vertical physics
	 */
	private applyGravity(delta: number, position: THREE.Vector3): void {
		// Apply gravity
		this.velocity.y += this.gravity * delta;

		// Terminal velocity
		if (this.velocity.y < this.terminalVelocity) {
			this.velocity.y = this.terminalVelocity;
		}

		// Calculate vertical movement
		const verticalOffset = new THREE.Vector3(0, this.velocity.y * delta, 0);

		// Check ground collision
		if (this.velocity.y <= 0) {
			// Moving down or stationary - check if we hit ground
			if (this.checkCollision(position, verticalOffset)) {
				// Find exact ground position by checking small steps down
				let groundOffset = 0;
				const step = 0.02;
				for (let i = step; i <= Math.abs(verticalOffset.y); i += step) {
					if (this.checkCollision(position, new THREE.Vector3(0, -i, 0))) {
						groundOffset = -(i - step);
						break;
					}
				}

				position.y += groundOffset;
				this.velocity.y = 0;
				this.isGrounded = true;
				this.canJump = true;
			} else {
				position.add(verticalOffset);
				// Check if we're still on ground (just barely above)
				const groundCheck = new THREE.Vector3(0, -0.1, 0);
				this.isGrounded = this.checkCollision(position, groundCheck);
				if (this.isGrounded) {
					this.velocity.y = 0;
					this.canJump = true;
				}
			}
		} else {
			// Moving up - check ceiling
			if (this.checkCollision(position, verticalOffset)) {
				this.velocity.y = 0;
				// Don't move up into ceiling
			} else {
				position.add(verticalOffset);
				this.isGrounded = false;
			}
		}
	}

	/**
	 * Handle horizontal movement with collision
	 */
	private applyHorizontalMovement(
		delta: number,
		position: THREE.Vector3,
		direction: THREE.Vector3,
		speed: number
	): void {
		if (direction.length() === 0) return;

		const moveDistance = speed * delta;

		// Try X movement
		const xOffset = new THREE.Vector3(direction.x * moveDistance, 0, 0);
		if (!this.checkCollision(position, xOffset)) {
			position.add(xOffset);
		}

		// Try Z movement
		const zOffset = new THREE.Vector3(0, 0, direction.z * moveDistance);
		if (!this.checkCollision(position, zOffset)) {
			position.add(zOffset);
		}
	}

	/**
	 * Attempt to make the player jump
	 */
	public jump(): void {
		if (this.isGrounded && this.canJump) {
			this.velocity.y = this.jumpStrength;
			this.isGrounded = false;
			this.canJump = false;
		}
	}

	/**
	 * Main physics update - call this every frame
	 */
	public update(
		delta: number,
		position: THREE.Vector3,
		horizontalDirection: THREE.Vector3,
		speed: number
	): void {
		// Apply horizontal movement
		this.applyHorizontalMovement(delta, position, horizontalDirection, speed);
		// Apply gravity and vertical physics
		this.applyGravity(delta, position);
	}

	/**
	 * Get current physics state
	 */
	public getState() {
		return {
			velocity: this.velocity.clone(),
			isGrounded: this.isGrounded,
			canJump: this.canJump
		};
	}

	/**
	 * Reset physics state
	 */
	public reset(): void {
		this.velocity.set(0, 0, 0);
		this.isGrounded = false;
		this.canJump = true;
	}
}
