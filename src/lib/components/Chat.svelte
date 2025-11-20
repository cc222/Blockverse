<script lang="ts">
	import { ChatManager } from '$lib/game/Managers/ChatManager.svelte';
	import { onDestroy, onMount } from 'svelte';

	let inputRef: HTMLInputElement | undefined = $state(undefined);
	let input = $state('');

	let {
		chatManager
	}: {
		chatManager: ChatManager;
	} = $props();

	const sendMessage = () => {
		if (!input.trim() || !chatManager) return;
		chatManager.sendMessage(input);
		input = '';
		unfocusChat();
	};

	const focusChat = () => inputRef?.focus();
	const unfocusChat = () => inputRef?.blur();

	//TODO: make it in controlsManager
	const handleKeyDown = (event: KeyboardEvent) => {
		if (chatManager?.isEnabled)
			if (event.key === 't' || event.key === '/') {
				//event.preventDefault();
				focusChat();
			}
	};

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if chatManager?.isEnabled}
	<div class="chat-container">
		<div class="messages">
			{#each chatManager.messages as msg}
				<div class="message">{msg}</div>
			{/each}
		</div>
		<div class="input-container">
			<input
				bind:this={inputRef}
				type="text"
				bind:value={input}
				placeholder="Napisz wiadomość..."
				onkeydown={(e) => e.key === 'Enter' && sendMessage()}
			/>
			<button onclick={sendMessage}>Wyślij</button>
		</div>
	</div>
{/if}

<style>
	.chat-container {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		width: 400px;
		max-height: 400px;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		font-family: sans-serif;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
	}

	.message {
		margin-bottom: 0.25rem;
	}

	.input-container {
		display: flex;
		gap: 0.5rem;
	}

	input {
		flex: 1;
		padding: 0.5rem;
		border-radius: 4px;
		border: none;
		outline: none;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #222;
		color: white;
		cursor: pointer;
	}

	button:hover {
		background-color: #444;
	}
</style>
