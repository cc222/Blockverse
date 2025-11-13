import * as THREE from 'three';

export class ThreeManager {
	static scene: THREE.Scene;
	static camera: THREE.PerspectiveCamera;
	static renderer: THREE.WebGLRenderer;

	static init(canvas: HTMLCanvasElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87ceeb);
		this.scene.fog = new THREE.FogExp2(0x202020, 0.02);

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 100, 0);

		this.renderer = new THREE.WebGLRenderer({ canvas });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;

		const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
		this.scene.add(hemi);

		const dir = new THREE.DirectionalLight(0xffffff, 0.8);
		dir.position.set(-20, 40, 20);
		dir.castShadow = true;
		this.scene.add(dir);
	}

	static render() {
		this.renderer.render(this.scene, this.camera);
	}
}
