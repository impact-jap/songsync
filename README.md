# SyncLyrics

> SyncLyrics is a Rust-based lyric synchronization engine powered by the word-level Speech-to-Text technology developed by [Super Calendar (super-calendar.io)](https://super-calendar.io)'s and distributed as a WebAssembly (WASM) package.

With this application, you can:

- Parse SRT, WebVTT, LRC, Apple/enhanced LRC, TTML and TXT.
- Convert between supported text formats.
- Generate render nodes for phrase, word, and grapheme highlighting.
- Adjust timing offsets


## Features

- Load local audio files directly in the browser.
- Load lyric/subtitle files by clicking the lyrics button or dragging files into the page.
- Parse common lyric and subtitle formats.
- Convert lyrics into plain text, phrase LRC, Apple/enhanced LRC, SRT, WebVTT, TTML, and TXT outputs.
- Preview synchronized lyrics with a built-in karaoke player.
- Switch cursor granularity between phrase, word, and grapheme highlighting.
- Adjust timing with a real-time millisecond offset.
- Copy or download generated outputs from each panel.
- Run as a static site on GitHub Pages or any normal static host.

## Supported input formats

SyncLyrics can detect and parse:

- LRC
- Apple/enhanced LRC
- SRT
- WebVTT
- TTML/XML
- TXT

## Output formats

The studio can export:

- Plain text
- Phrase LRC
- Apple/enhanced word LRC
- SRT
- WebVTT
- TTML
- TXT

The three main panels show:

| Panel | Purpose |
| --- | --- |
| Plain Text | Clean lyric text without timestamps |
| Phrase Sync | Phrase-level LRC output |
| Word-by-Word Sync | Apple/enhanced LRC-style word timing output |

The settings panel also includes a manual export target for additional subtitle formats.

## How it works

SyncLyrics is split into two layers:

```text
Rust/WASM engine
  - parsing
  - format conversion
  - render node generation
  - cursor state
  - seek timestamps

Browser UI
  - file inputs
  - audio playback
  - DOM rendering
  - canvas preview hook
  - copy/download actions
  - layout and controls
```

This keeps the synchronization engine portable. The same core model can be used by a web UI, a native desktop app, or a mobile frontend without coupling the engine to a specific rendering layer.

## Runtime model

The WASM package exposes two main capabilities:

```text
convert_text(input, from, to, options_json)
SyncLyricsRuntime(input, from, options_json)
```

The web application uses `convert_text` to generate exported text formats and `SyncLyricsRuntime` to drive karaoke playback.

The runtime provides:

- `document_json()`
- `render_nodes_json()`
- `state_at(time_ms)`
- `seek_time_for_node(node_id)`

The UI calls `state_at(audio.currentTime * 1000)` during playback and updates the active phrase, word, or grapheme in the karaoke view.

## Cursor granularity

The karaoke player supports three display modes:

| UI label | Runtime value | Behavior |
| --- | --- | --- |
| Phrase | `cue` | Highlights the current phrase/line |
| Word | `word` | Highlights the active word |
| Grapheme | `grapheme` | Highlights smaller text units |

For phrase-level LRC files like this:

```lrc
[00:23.13]There stood a log cabin made of earth and wood
[00:26.03]Where lived a country boy named Johnny B. Goode
```

phrase mode is the most accurate mode, because those files only contain phrase timestamps.

Word and grapheme mode are only truly precise when the source file contains word-level timing, such as Apple/enhanced LRC, TTML with timed spans, or a richer internal timing model. If the input only contains phrase timestamps, the engine may infer word or grapheme positions from the phrase interval.

## Timing offset

Use **Offset milliseconds** to compensate for audio/lyrics delay.

Examples:

```text
100    lyrics appear 100 ms later
-100   lyrics appear 100 ms earlier
250    lyrics appear 250 ms later
```

The offset is applied to conversion and karaoke runtime preview, so it can be used to test timing in real time before exporting.

## Project structure

```text
.
├── index.html
├── favicon.ico
├── images/
│   └── icons/
├── pkg/
│   ├── synclyrics_wasm.js
│   └── synclyrics_wasm_bg.wasm
├── src/
│   ├── app/
│   ├── backend/
│   ├── config/
│   ├── domain/
│   ├── player/
│   ├── ui/
│   └── utils/
└── styles/
    ├── base.css
    ├── controls.css
    ├── layout.css
    ├── panels.css
    └── player.css
```

Important files:

| File | Purpose |
| --- | --- |
| `index.html` | Main static application shell |
| `src/main.js` | Application entry point |
| `src/app/app-controller.js` | UI wiring and event coordination |
| `src/app/conversion-controller.js` | Conversion flow and export handling |
| `src/backend/synclyrics-service.js` | Thin JavaScript adapter around the WASM API |
| `src/backend/wasm-backend.js` | Dynamic WASM package loader |
| `src/player/lyrics-player.js` | Playback loop and runtime synchronization |
| `src/player/dom-lyrics-renderer.js` | DOM karaoke renderer |
| `src/domain/formats.js` | Input format detection |
| `styles/player.css` | Karaoke player styling |

## Run locally

Because the app uses ES modules and WASM, open it through a local static server instead of directly opening `index.html`.

Examples:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

Or with Node:

```bash
npx serve .
```

## Deploy to GitHub Pages

This application can run on GitHub Pages without a backend.

The simplest deployment is:

```text
repository root
  index.html
  src/
  styles/
  pkg/
  images/
  favicon.ico
```

Then configure GitHub Pages to deploy from the branch root.

If you prefer using `/docs`, move the same final static files into:

```text
docs/
  index.html
  src/
  styles/
  pkg/
  images/
  favicon.ico
```

Then configure GitHub Pages to deploy from `/docs`.

A CI/CD workflow is optional. You only need CI/CD if you want GitHub Actions to compile the Rust/WASM package automatically before publishing. If `pkg/` is already committed with the generated WASM files, GitHub Pages can serve the app directly.

## Common problems

### WASM package could not be loaded

Check that these files exist at the deployed path:

```text
pkg/synclyrics_wasm.js
pkg/synclyrics_wasm_bg.wasm
```

Also check the browser Network tab. If the request returns HTML instead of JavaScript or WASM, the path is wrong or the file was not published.

### The page loads but conversion does not work

Open the browser console and check whether the WASM package loaded successfully. The app should report that the WASM backend is ready.

### Word or grapheme highlighting feels slightly off

Use phrase mode when the source file only has phrase-level timestamps. Word and grapheme precision depends on word-level timing data in the source.

### Offset does not feel right

Try small increments first:

```text
-50
-25
0
25
50
```

Use the audio player and karaoke preview together until the phrase or word highlight matches the vocal timing.

## Browser support

SyncLyrics targets modern browsers with support for:

- ES modules
- WebAssembly
- File API
- Blob/Object URLs
- HTML audio playback

Recent versions of Firefox, Chrome, Edge, and Safari should work.

## Privacy

Files are loaded locally in the browser. The static web application does not require a server upload step for audio or lyric files.

## License

MIT
