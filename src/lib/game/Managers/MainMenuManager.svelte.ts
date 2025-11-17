import * as THREE from 'three';
import { BaseManager } from './BaseManager';
import type { ThreeManager } from './ThreeManager';

export interface BlockUserData {
	speedX: number;
	speedY: number;
	speedZ: number;
	rotSpeedX: number;
	rotSpeedY: number;
}

export class MainMenuManager extends BaseManager {
	public isEnabled: boolean = $state(false);
	private animationId: number | null = null;
	private blocks: THREE.Mesh[] = [];

	constructor(private threeManager: ThreeManager) {
		super();
		this.enable();
	}

	enable() {
		this.isEnabled = true;
		this.setupSceneForMainMenu();
		this.animate();
	}

	disable() {
		this.isEnabled = false;
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}
	}

	protected async onDestroy(): Promise<void> {
		this.disable();
	}

	private setupSceneForMainMenu() {
		this.threeManager.camera.position.z = 30;

		this.threeManager.renderer.dispose();
		this.threeManager.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			canvas: this.threeManager.canvas
		});

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const colors = [0x6366f1, 0x8b5cf6, 0xf59e0b, 0x10b981];

		for (let i = 0; i < 50; i++) {
			const material = new THREE.MeshPhongMaterial({
				color: colors[Math.floor(Math.random() * colors.length)],
				transparent: true,
				opacity: 0.75
			});
			const cube = new THREE.Mesh(geometry, material);

			cube.position.x = (Math.random() - 0.5) * 40;
			cube.position.y = (Math.random() - 0.5) * 40;
			cube.position.z = (Math.random() - 0.5) * 40;

			cube.rotation.x = Math.random() * Math.PI;
			cube.rotation.y = Math.random() * Math.PI;

			const userData: BlockUserData = {
				speedX: (Math.random() - 0.5) * 0.04,
				speedY: (Math.random() - 0.5) * 0.04,
				speedZ: (Math.random() - 0.5) * 0.04,
				rotSpeedX: (Math.random() - 0.5) * 0.02,
				rotSpeedY: (Math.random() - 0.5) * 0.02
			};
			cube.userData = userData;

			this.threeManager.scene.add(cube);
			this.blocks.push(cube);
		}

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		this.threeManager.scene.add(ambientLight);

		const pointLight1 = new THREE.PointLight(0x6366f1, 1, 100);
		pointLight1.position.set(10, 10, 10);
		this.threeManager.scene.add(pointLight1);

		const pointLight2 = new THREE.PointLight(0x8b5cf6, 1, 100);
		pointLight2.position.set(-10, -10, -10);
		this.threeManager.scene.add(pointLight2);
	}

	animate = () => {
		this.animationId = requestAnimationFrame(this.animate);

		this.blocks.forEach((block) => {
			const data = block.userData as BlockUserData;

			block.position.x += data.speedX;
			block.position.y += data.speedY;
			block.position.z += data.speedZ;

			block.rotation.x += data.rotSpeedX;
			block.rotation.y += data.rotSpeedY;

			// Wrap
			if (Math.abs(block.position.x) > 20) block.position.x *= -1;
			if (Math.abs(block.position.y) > 20) block.position.y *= -1;
			if (Math.abs(block.position.z) > 20) block.position.z *= -1;
		});

		this.threeManager.camera.position.x = Math.sin(Date.now() * 0.0001) * 2;
		this.threeManager.camera.position.y = Math.cos(Date.now() * 0.0001) * 2;
		this.threeManager.camera.lookAt(0, 0, 0);
		this.threeManager.render();
	};
}
