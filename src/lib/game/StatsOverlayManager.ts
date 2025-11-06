import Stats from 'stats.js';

export class StatsOverlayManager {
	stats: Stats;
	isEnabled: boolean = true;
	position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left';

	updateStyles() {
		this.stats.dom.style.position = 'fixed';
		this.stats.dom.style.zIndex = '9999';
		if (!this.isEnabled) {
			this.stats.dom.style.display = 'none';
		}
		switch (this.position) {
			case 'top-left':
				this.stats.dom.style.top = '0';
				this.stats.dom.style.left = '0';
				this.stats.dom.style.bottom = '';
				this.stats.dom.style.right = '';
				break;
			case 'top-right':
				this.stats.dom.style.top = '0';
				this.stats.dom.style.right = '0';
				this.stats.dom.style.bottom = '';
				this.stats.dom.style.left = '';
				break;
			case 'bottom-left':
				this.stats.dom.style.bottom = '0';
				this.stats.dom.style.left = '0';
				this.stats.dom.style.top = '';
				this.stats.dom.style.right = '';
				break;
			case 'bottom-right':
				this.stats.dom.style.bottom = '0';
				this.stats.dom.style.right = '0';
				this.stats.dom.style.top = '';
				this.stats.dom.style.left = '';
				break;
		}
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

	constructor() {
		this.stats = new Stats();
		this.stats.showPanel(0);
		document.body.appendChild(this.stats.dom);
		this.updateStyles();
	}
}
