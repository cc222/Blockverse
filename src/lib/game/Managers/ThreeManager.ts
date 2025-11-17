import * as THREE from 'three';
import { BaseManager } from './BaseManager';

export class ThreeManager extends BaseManager {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;

	constructor(public canvas: HTMLCanvasElement) {
		super();
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		this.renderer = new THREE.WebGLRenderer({ canvas });
		//this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;

		window.addEventListener('resize', this.onResize);
	}

	setupSceneForGame() {
		this.scene.background = new THREE.Color(0x87ceeb);
		this.scene.fog = new THREE.FogExp2(0x202020, 0.02);
		this.camera.position.set(0, 100, 0);
		const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
		this.scene.add(hemi);

		const dir = new THREE.DirectionalLight(0xffffff, 0.8);
		dir.position.set(-20, 40, 20);
		dir.castShadow = true;
		this.scene.add(dir);
	}

	protected async onDestroy(): Promise<void> {
		this.renderer.dispose();
		window.removeEventListener('resize', this.onResize);
	}

	render() {
		this.renderer.render(this.scene, this.camera);
	}

	private onResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};
}
