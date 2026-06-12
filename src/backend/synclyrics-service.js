import { getWasmBackend, loadWasmBackend } from './wasm-backend.js';

export class SyncLyricsService {
  async init() {
    await loadWasmBackend();
  }

  convert(input, options) {
    const wasm = getWasmBackend();
    return wasm.convert_text(
      input,
      options.from,
      options.to,
      JSON.stringify({
        lrc_style: options.lrcStyle || 'phrase',
        offset_ms: Number(options.offsetMs || 0)
      })
    );
  }

  inspect(input, from) {
    const wasm = getWasmBackend();
    return JSON.parse(wasm.inspect_text(input, from));
  }

  createRuntime(input, options) {
    const wasm = getWasmBackend();
    const runtime = new wasm.SyncLyricsRuntime(
      input,
      options.from,
      JSON.stringify({
        offset_ms: Number(options.offsetMs || 0),
        cursor: {
          granularity: options.granularity || 'word',
          lead_ms: Number(options.leadMs || 0),
          tolerance_ms: Number(options.toleranceMs || 24),
          last_word_hold_ms: Number(options.lastWordHoldMs || 600),
          include_nodes: false
        }
      })
    );

    return {
      document: JSON.parse(runtime.document_json()),
      nodes: JSON.parse(runtime.render_nodes_json()),
      stateAt(timeMs) {
        return JSON.parse(runtime.state_at(timeMs));
      },
      seekTimeForNode(nodeId) {
        return runtime.seek_time_for_node(nodeId);
      }
    };
  }
}
