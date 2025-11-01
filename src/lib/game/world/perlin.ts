// src/game/perlin.ts
// Lightweight Perlin noise implementation (improved Perlin)
export class Perlin {
	perm: number[] = [];

	constructor(seed = 0) {
		this.setSeed(seed);
	}

	setSeed(seed: number) {
		// simple seed shuffle
		const p = new Array(256).fill(0).map((_, i) => i);
		let s = seed;
		for (let i = 255; i > 0; i--) {
			s = (s * 234927 + 12345) & 0xffffffff;
			const j = Math.abs(s) % (i + 1);
			const tmp = p[i];
			p[i] = p[j];
			p[j] = tmp;
		}
		this.perm = p.concat(p);
	}

	private fade(t: number) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}
	private lerp(t: number, a: number, b: number) {
		return a + t * (b - a);
	}
	private grad(hash: number, x: number, y: number, z: number) {
		const h = hash & 15;
		const u = h < 8 ? x : y;
		const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
		return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
	}

	noise(x: number, y = 0, z = 0) {
		// Find unit cube that contains point
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		const Z = Math.floor(z) & 255;

		// Find relative x,y,z of point in cube
		const xf = x - Math.floor(x);
		const yf = y - Math.floor(y);
		const zf = z - Math.floor(z);

		// Compute fade curves
		const u = this.fade(xf);
		const v = this.fade(yf);
		const w = this.fade(zf);

		const p = this.perm;

		// Hash coordinates of the 8 cube corners
		const A = p[X] + Y;
		const AA = p[A] + Z;
		const AB = p[A + 1] + Z;
		const B = p[X + 1] + Y;
		const BA = p[B] + Z;
		const BB = p[B + 1] + Z;

		// Add blended results from 8 corners
		const res = this.lerp(
			w,
			this.lerp(
				v,
				this.lerp(u, this.grad(p[AA], xf, yf, zf), this.grad(p[BA], xf - 1, yf, zf)),
				this.lerp(u, this.grad(p[AB], xf, yf - 1, zf), this.grad(p[BB], xf - 1, yf - 1, zf))
			),
			this.lerp(
				v,
				this.lerp(
					u,
					this.grad(p[AA + 1], xf, yf, zf - 1),
					this.grad(p[BA + 1], xf - 1, yf, zf - 1)
				),
				this.lerp(
					u,
					this.grad(p[AB + 1], xf, yf - 1, zf - 1),
					this.grad(p[BB + 1], xf - 1, yf - 1, zf - 1)
				)
			)
		);

		// normalize to [0,1]
		return (res + 1) / 2;
	}
}
