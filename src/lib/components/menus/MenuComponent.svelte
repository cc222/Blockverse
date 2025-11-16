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
				{#each menu.menuOptions.filter((opt) => opt.isEnabled) as option, index (option)}
					<button
						class="menu-button"
						class:selected={menu.selectedOption === index}
						onmouseenter={() => (menu.selectedOption = index)}
						onclick={() => option.onClick()}
					>
						{option.label + (option.selectedOption ? `: ${option.selectedOption}` : '')}
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
	:root {
		--bg-overlay: rgba(5, 8, 20, 0.75);
		--panel-bg: linear-gradient(180deg, rgba(18, 22, 40, 0.95), rgba(14, 17, 30, 0.95));
		--panel-border: rgba(99, 102, 241, 0.12);
		--accent: linear-gradient(90deg, #6366f1, #8b5cf6 50%, #3bd1b3 100%);
		--accent-solid: #6366f1;
		--muted: #9aa0c4;
		--text: #e6e9ff;
		--success: #10b981;
		--glass: rgba(255, 255, 255, 0.03);
		--radius: 16px;
		--shadow-lg: 0 18px 40px rgba(2, 6, 23, 0.7);
	}

	/* Overlay */
	.pause-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		backdrop-filter: blur(6px) saturate(1.05);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 24px;
		animation: fadeIn 180ms ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.995);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Card */
	.pause-menu {
		width: min(720px, 96%);
		max-width: 720px;
		background: var(--panel-bg);
		border: 1px solid var(--panel-border);
		border-radius: var(--radius);
		padding: 28px;
		box-shadow: var(--shadow-lg);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 18px;
	}

	/* Title */
	.menu-title {
		margin: 0;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		font-weight: 800;
		letter-spacing: -0.02em;
		font-size: 1.75rem;
		color: var(--text);
		text-align: center;
		background: var(--accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: 0 6px 28px rgba(59, 209, 179, 0.04);
	}

	/* Options list */
	.menu-options {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
		width: 100%;
	}

	/* Button base */
	.menu-button {
		appearance: none;
		-webkit-appearance: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 12px 18px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
		border: 1px solid rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		color: var(--text);
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition:
			transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1),
			box-shadow 160ms,
			border-color 160ms,
			background 160ms;
		box-shadow: 0 6px 18px rgba(2, 6, 23, 0.45);
		text-align: left;
		outline: none;
	}

	.menu-button .label {
		display: inline-block;
		flex: 1 1 auto;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text);
	}

	.menu-button .opt-value {
		flex: 0 0 auto;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;
		background: var(--glass);
		padding: 6px 10px;
		border-radius: 8px;
		font-size: 0.9rem;
		color: var(--muted);
		border: 1px solid rgba(255, 255, 255, 0.03);
	}

	/* Hover / selected */
	.menu-button:hover {
		transform: translateY(-3px);
		border-color: rgba(99, 102, 241, 0.22);
		box-shadow: 0 20px 36px rgba(2, 6, 23, 0.65);
		background: linear-gradient(180deg, rgba(99, 102, 241, 0.04), rgba(59, 209, 179, 0.02));
	}

	.menu-button.selected,
	.menu-button[selected] {
		/* subtle accent background + left accent bar */
		background: linear-gradient(90deg, rgba(99, 102, 241, 0.06), rgba(59, 209, 179, 0.02));
		border-color: rgba(99, 102, 241, 0.28);
		position: relative;
		box-shadow: 0 24px 48px rgba(2, 6, 23, 0.72);
	}

	.menu-button.selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: linear-gradient(180deg, #6366f1, #3bd1b3);
		border-top-left-radius: 12px;
		border-bottom-left-radius: 12px;
	}

	/* Focus visible for keyboard users */
	.menu-button:focus-visible {
		outline: 3px solid rgba(99, 102, 241, 0.18);
		outline-offset: 4px;
	}

	/* Active press feedback */
	.menu-button:active {
		transform: translateY(0);
		box-shadow: 0 8px 14px rgba(2, 6, 23, 0.6);
	}

	/* Hint text */
	.menu-hint {
		font-family:
			'Inter',
			system-ui,
			-apple-system;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
		margin-top: 6px;
		opacity: 0.95;
	}

	/* Responsywność */
	@media (max-width: 720px) {
		.pause-menu {
			width: 100%;
			padding: 18px;
			border-radius: 12px;
		}

		.menu-title {
			font-size: 1.35rem;
		}

		.menu-button {
			padding: 10px 14px;
			font-size: 0.96rem;
			border-radius: 10px;
		}

		.menu-button .opt-value {
			padding: 4px 8px;
			font-size: 0.82rem;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.pause-overlay,
		.pause-menu,
		.menu-button {
			animation: none;
			transition: none;
		}
	}
</style>
