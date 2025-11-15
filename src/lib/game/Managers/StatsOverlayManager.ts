import Stats from 'stats.js';
import { BaseManager } from './BaseManager';

export enum EStatsPosition {
	TOP_LEFT = 'top-left',
	TOP_RIGHT = 'top-right',
	BOTTOM_LEFT = 'bottom-left',
	BOTTOM_RIGHT = 'bottom-right'
}

export class StatsOverlayManager extends BaseManager {
	private stats: Stats;
	isEnabled = false;
	position: EStatsPosition = EStatsPosition.TOP_LEFT;

	constructor() {
		super();
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

		const positions: Record<EStatsPosition, Partial<CSSStyleDeclaration>> = {
			[EStatsPosition.TOP_LEFT]: { top: '0', left: '0', right: '', bottom: '' },
			[EStatsPosition.TOP_RIGHT]: { top: '0', right: '0', left: '', bottom: '' },
			[EStatsPosition.BOTTOM_LEFT]: { bottom: '0', left: '0', top: '', right: '' },
			[EStatsPosition.BOTTOM_RIGHT]: { bottom: '0', right: '0', top: '', left: '' }
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
