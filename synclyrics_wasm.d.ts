/* tslint:disable */
/* eslint-disable */

export class SyncLyricsRuntime {
    free(): void;
    [Symbol.dispose](): void;
    document_json(): string;
    constructor(input: string, from: string, options_json: string);
    render_nodes_json(): string;
    seek_time_for_node(node_id: string): number | undefined;
    state_at(time_ms: number): string;
}

export function convert_text(input: string, from: string, to: string, options_json: string): string;

export function inspect_text(input: string, from: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_synclyricsruntime_free: (a: number, b: number) => void;
    readonly convert_text: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly inspect_text: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly synclyricsruntime_document_json: (a: number) => [number, number, number, number];
    readonly synclyricsruntime_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly synclyricsruntime_render_nodes_json: (a: number) => [number, number, number, number];
    readonly synclyricsruntime_seek_time_for_node: (a: number, b: number, c: number) => [number, number];
    readonly synclyricsruntime_state_at: (a: number, b: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
