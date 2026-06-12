// web/synclyrics-hook.js
let wasmModule = null;

async function init() {
  if (wasmModule) return wasmModule;
  wasmModule = await import('./pkg/synclyrics_wasm.js');
  await wasmModule.default();
  return wasmModule;
}

function convert(input, options) {
  if (!wasmModule) throw new Error('SyncLyrics WASM is not initialized.');
  const from = options.from || 'lrc';
  const to = options.to || 'json';
  const payload = JSON.stringify({
    segment: Boolean(options.segment),
    profile: options.profile || 'human-default',
    profile_json: options.profile_json || null,
    lrc_style: options.lrc_style || 'phrase'
  });
  return wasmModule.convert_text(input, from, to, payload);
}

function inspect(input, from) {
  if (!wasmModule) throw new Error('SyncLyrics WASM is not initialized.');
  return wasmModule.inspect_text(input, from || 'lrc');
}

window.SyncLyricsHook = { init, convert, inspect };
