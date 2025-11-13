import * as THREE from 'three';
import { Block, BlockId } from '../world/blocks';

export interface TextureAtlas {
	texture: THREE.Texture;
	uvs: Partial<Record<BlockId, THREE.Vector4>>; // [u0, v0, u1, v1]
}

export let textureAtlas: TextureAtlas;
export let atlasCanvas: HTMLCanvasElement;

export async function createTextureAtlas(size = 16): Promise<TextureAtlas> {
	const loader = new THREE.ImageLoader();
	atlasCanvas = document.createElement('canvas');
	const ctx = atlasCanvas.getContext('2d')!;
	const blockCount = Block.defs.length;

	const cols = Math.ceil(Math.sqrt(blockCount));
	const rows = cols;

	atlasCanvas.width = cols * size;
	atlasCanvas.height = rows * size;

	const uvs: Partial<Record<BlockId, THREE.Vector4>> = {};

	for (let i = 0; i < blockCount; i++) {
		if (i === BlockId.Air) continue; // skip air block
		const def = Block.defs[i];
		// derive filename from enum name (e.g. BlockId[def.id] -> 'Air')
		const name = BlockId[def.id].toLowerCase();
		const img = await loadImage(loader, `textures/blocks/${name}.png`);

		const x = (i % cols) * size;
		const y = Math.floor(i / cols) * size;
		ctx.drawImage(img, x, y, size, size);

		// Ustaw UV w [0,1]
		const u0 = x / atlasCanvas.width;
		const v0 = y / atlasCanvas.height;
		const u1 = (x + size) / atlasCanvas.width;
		const v1 = (y + size) / atlasCanvas.height;
		uvs[def.id] = new THREE.Vector4(u0, v0, u1, v1);
	}

	const texture = new THREE.CanvasTexture(atlasCanvas);
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	textureAtlas = { texture, uvs: uvs as Record<BlockId, THREE.Vector4> };
	document.body.appendChild(atlasCanvas);
	atlasCanvas.style.display = 'none';
	atlasCanvas.style.border = '1px solid red';
	atlasCanvas.style.position = 'absolute';
	atlasCanvas.style.top = '10px';
	atlasCanvas.style.left = '10px';

	return textureAtlas;
}

export function setDebugAtlasIsEnabled(isEnabled: boolean) {
	atlasCanvas.style.display = isEnabled ? 'block' : 'none';
}

function loadImage(loader: THREE.ImageLoader, path: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		loader.load(path, resolve, undefined, reject);
	});
}
