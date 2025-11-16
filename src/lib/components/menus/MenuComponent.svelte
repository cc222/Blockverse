<script lang="ts">
	import { onMount } from 'svelte';
	import type { Menu } from './Menu.svelte';
	let {
		menu
	}: {
		menu: Menu;
	} = $props();

	onMount(() => {
		return menu.initialize();
	});
</script>

{#if menu.showMenu}
	<div class="pause-overlay">
		<div class="pause-menu">
			<h1 class="menu-title">Menu Gry</h1>

			<div class="menu-options">
				{#each menu.menuOptions as option, index}
					{#if option.isEnabled}
						<button
							class="menu-button"
							class:selected={menu.selectedOption === index}
							onmouseenter={() => (menu.selectedOption = index)}
							onclick={() => option.onClick()}
						>
							{option.label + (option.selectedOption ? `: ${option.selectedOption}` : '')}
						</button>
					{/if}
				{/each}
			</div>

			<div class="menu-hint">
				Użyj strzałek ↑↓ lub myszy do nawigacji • Enter lub kliknij aby wybrać • ESC aby wrócić
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--primary: #6366f1;
		--primary-dark: #4f46e5;
		--secondary: #8b5cf6;
		--bg-dark: #0f0f23;
		--bg-card: rgba(30, 30, 60, 0.95);
		--text: #e0e0ff;
		--text-dim: #a0a0c0;
		--accent: #f59e0b;
		--border: rgba(99, 102, 241, 0.3);
	}

	.pause-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(15, 15, 35, 0.85);
		backdrop-filter: blur(20px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			backdrop-filter: blur(0px);
		}
		to {
			opacity: 1;
			backdrop-filter: blur(20px);
		}
	}

	.pause-menu {
		background: var(--bg-card);
		backdrop-filter: blur(40px);
		border: 2px solid var(--border);
		border-radius: 24px;
		box-shadow:
			0 0 0 1px rgba(99, 102, 241, 0.1),
			0 20px 60px rgba(0, 0, 0, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		padding: 3rem 2.5rem;
		min-width: 450px;
		max-width: 90vw;
		animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideIn {
		from {
			transform: translateY(-30px) scale(0.95);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	.menu-title {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 2.5rem;
		font-weight: 900;
		background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-align: center;
		margin: 0 0 2rem 0;
		letter-spacing: -0.05em;
		filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.4));
		animation: glow 3s ease-in-out infinite;
	}

	@keyframes glow {
		0%,
		100% {
			filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3)) brightness(1);
		}
		50% {
			filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.6)) brightness(1.2);
		}
	}

	.menu-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.menu-button {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 1rem;
		font-weight: 600;
		padding: 1rem 1.5rem;
		background: rgba(15, 15, 35, 0.6);
		border: 2px solid var(--border);
		border-radius: 12px;
		color: var(--text);
		cursor: pointer;
		text-align: left;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
		overflow: hidden;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.menu-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 0%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
		transition: width 0.4s ease;
	}

	.menu-button.selected::before {
		width: 100%;
	}

	.menu-button::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(99, 102, 241, 0.2);
		transform: translate(-50%, -50%);
		transition:
			width 0.6s,
			height 0.6s;
	}

	.menu-button:active::after {
		width: 300px;
		height: 300px;
	}

	.menu-button.selected {
		background: rgba(99, 102, 241, 0.15);
		border-color: var(--primary);
		color: #fff;
		transform: translateX(8px);
		box-shadow:
			0 0 0 1px var(--primary),
			0 8px 24px rgba(99, 102, 241, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.menu-button:active {
		transform: translateX(6px) scale(0.98);
		box-shadow:
			0 0 0 1px var(--primary-dark),
			0 4px 12px rgba(99, 102, 241, 0.3);
	}

	.menu-button:focus-visible {
		outline: 3px solid var(--primary);
		outline-offset: 3px;
	}

	.menu-hint {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 0.75rem;
		color: var(--text-dim);
		text-align: center;
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		opacity: 0.8;
	}

	/* Responsywność */
	@media (max-width: 768px) {
		.pause-menu {
			padding: 2rem 1.5rem;
			min-width: auto;
			width: calc(100% - 2rem);
			border-radius: 16px;
		}

		.menu-title {
			font-size: 2rem;
			margin-bottom: 1.5rem;
		}

		.menu-button {
			padding: 0.875rem 1.25rem;
			font-size: 0.9375rem;
		}

		.menu-hint {
			font-size: 0.6875rem;
		}
	}

	@media (max-width: 480px) {
		.pause-menu {
			padding: 1.5rem 1rem;
		}

		.menu-title {
			font-size: 1.75rem;
		}

		.menu-button {
			padding: 0.75rem 1rem;
			font-size: 0.875rem;
		}

		.menu-options {
			gap: 0.5rem;
		}
	}

	/* Animacja wejścia dla przycisków */
	.menu-button {
		animation: buttonSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	.menu-button:nth-child(1) {
		animation-delay: 0.05s;
	}
	.menu-button:nth-child(2) {
		animation-delay: 0.1s;
	}
	.menu-button:nth-child(3) {
		animation-delay: 0.15s;
	}
	.menu-button:nth-child(4) {
		animation-delay: 0.2s;
	}
	.menu-button:nth-child(5) {
		animation-delay: 0.25s;
	}

	@keyframes buttonSlideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Dark mode adjustments (opcjonalnie) */
	@media (prefers-color-scheme: light) {
		:root {
			--bg-dark: #f5f5fa;
			--bg-card: rgba(255, 255, 255, 0.95);
			--text: #1a1a2e;
			--text-dim: #6b6b8b;
		}

		.pause-overlay {
			background: rgba(245, 245, 250, 0.85);
		}
	}
</style>
