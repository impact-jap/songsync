let wasmModule = null;

export async function loadWasmBackend() {
  if (wasmModule) return wasmModule;
  try {
    wasmModule = await import('../../pkg/synclyrics_wasm.js');
    await wasmModule.default();
    return wasmModule;
  } catch (error) {
    throw new Error(`WASM package could not be loaded. Copy the generated pkg directory into web/pkg. ${error.message}`);
  }
}

export function getWasmBackend() {
  if (!wasmModule) {
    throw new Error('SyncLyrics WASM backend is not initialized.');
  }
  return wasmModule;
}
