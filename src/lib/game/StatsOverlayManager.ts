import Stats from 'stats.js';

type StatsPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export class StatsOverlayManager {
	private stats: Stats;
	isEnabled = true;
	position: StatsPosition = 'top-left';

	constructor() {
		this.stats = new Stats();
		this.stats.showPanel(0);
		document.body.appendChild(this.stats.dom);
		this.applyBaseStyles();
		this.updateStyles();
	}

	private applyBaseStyles() {
		Object.assign(this.stats.dom.style, {
			position: 'fixed',
			zIndex: '9999'
		});
	}

	updateStyles() {
		this.stats.dom.style.display = this.isEnabled ? 'block' : 'none';

		const positions: Record<StatsPosition, Partial<CSSStyleDeclaration>> = {
			'top-left': { top: '0', left: '0', right: '', bottom: '' },
			'top-right': { top: '0', right: '0', left: '', bottom: '' },
			'bottom-left': { bottom: '0', left: '0', top: '', right: '' },
			'bottom-right': { bottom: '0', right: '0', top: '', left: '' }
		};

		Object.assign(this.stats.dom.style, positions[this.position]);
	}

	beginStatsFrame() {
		if (this.isEnabled) {
			this.stats.begin();
		}
	}

	endStatsFrame() {
		if (this.isEnabled) {
			this.stats.end();
		}
	}
}
