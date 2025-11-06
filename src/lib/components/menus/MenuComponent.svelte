<script lang="ts">
	import type { Menu } from './Menu.svelte';
	let {
		menu
	}: {
		menu: Menu;
	} = $props();
</script>

{#if menu.showMenu}
	<div class="pause-overlay">
		<div class="pause-menu">
			<h1 class="menu-title">Menu Gry</h1>

			<div class="menu-options">
				{#each menu.menuOptions as option, index}
					<button
						class="menu-button"
						class:selected={menu.selectedOption === index}
						onmouseenter={() => (menu.selectedOption = index)}
						onclick={() => option.action()}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<div class="menu-hint">
				Użyj strzałek ↑↓ lub myszy do nawigacji • Enter lub kliknij aby wybrać • ESC aby wrócić
			</div>
		</div>
	</div>
{/if}

<style>
	.pause-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.pause-menu {
		background: rgba(32, 32, 32, 0.95);
		border: 4px solid #3a3a3a;
		box-shadow:
			0 0 0 2px #000,
			0 8px 32px rgba(0, 0, 0, 0.8);
		padding: 40px;
		min-width: 400px;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.menu-title {
		font-family: 'Courier New', monospace;
		font-size: 32px;
		color: #ffffff;
		text-align: center;
		margin: 0 0 30px 0;
		text-shadow: 3px 3px 0 #000;
		letter-spacing: 2px;
	}

	.menu-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 20px;
	}

	.menu-button {
		font-family: 'Courier New', monospace;
		font-size: 18px;
		padding: 12px 20px;
		background: #6b6b6b;
		border: 2px solid #000;
		box-shadow:
			inset -2px -4px 0 rgba(0, 0, 0, 0.4),
			inset 2px 2px 0 rgba(255, 255, 255, 0.2);
		color: #e0e0e0;
		cursor: pointer;
		text-align: center;
		transition: all 0.1s;
		text-shadow: 2px 2px 0 #000;
	}

	.menu-button:hover,
	.menu-button.selected {
		background: #8b8b8b;
		color: #ffff00;
		transform: scale(1.02);
		box-shadow:
			inset -2px -4px 0 rgba(0, 0, 0, 0.3),
			inset 2px 2px 0 rgba(255, 255, 255, 0.3);
	}

	.menu-button:active {
		background: #5b5b5b;
		box-shadow: inset 2px 4px 0 rgba(0, 0, 0, 0.5);
		transform: scale(0.98);
	}

	.menu-hint {
		font-family: 'Courier New', monospace;
		font-size: 12px;
		color: #888;
		text-align: center;
		margin-top: 20px;
		text-shadow: 1px 1px 0 #000;
	}
</style>
