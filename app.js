// web/app.js
const state = {
  filename: 'synclyrics-output',
  inputText: '',
  jsonText: '',
  outputs: {},
  activeOutput: 'json',
  previewWords: []
};

const elements = {
  status: document.getElementById('status'),
  textFile: document.getElementById('text-file'),
  audioFile: document.getElementById('audio-file'),
  fromFormat: document.getElementById('from-format'),
  profile: document.getElementById('profile'),
  segment: document.getElementById('segment'),
  convert: document.getElementById('convert'),
  copyActive: document.getElementById('copy-active'),
  audio: document.getElementById('audio'),
  plain: document.getElementById('plain-output'),
  phrase: document.getElementById('phrase-output'),
  word: document.getElementById('word-output'),
  json: document.getElementById('json-output'),
  preview: document.getElementById('preview')
};

window.SyncLyricsHook.init()
  .then(() => { elements.status.textContent = 'WASM ready'; })
  .catch(error => { elements.status.textContent = `WASM failed: ${error.message}`; });

elements.textFile.addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  state.filename = file.name.replace(/\.[^.]+$/, '');
  state.inputText = await file.text();
  elements.status.textContent = `Loaded ${file.name}`;
  const detected = detectFormat(file.name);
  if (detected) elements.fromFormat.value = detected;
});

elements.audioFile.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  elements.audio.src = URL.createObjectURL(file);
  elements.audio.style.display = 'block';
});

elements.convert.addEventListener('click', () => {
  if (!state.inputText) {
    elements.status.textContent = 'Load a text file first.';
    return;
  }
  try {
    runConversion();
    elements.status.textContent = 'Converted.';
  } catch (error) {
    elements.status.textContent = `Error: ${error.message}`;
    console.error(error);
  }
});

elements.copyActive.addEventListener('click', async () => {
  const value = state.outputs[state.activeOutput] || state.jsonText || '';
  await navigator.clipboard.writeText(value);
  elements.status.textContent = 'Copied.';
});

document.querySelectorAll('[data-download]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.download;
    const value = state.outputs[key] || '';
    downloadText(`${state.filename}.${extensionFor(key)}`, value);
  });
});

document.querySelectorAll('[data-output]').forEach(panel => {
  panel.addEventListener('click', () => {
    state.activeOutput = panel.dataset.output;
  });
});

elements.audio.addEventListener('timeupdate', () => {
  const currentMs = elements.audio.currentTime * 1000;
  let activePhrase = null;
  for (let index = 0; index < state.previewWords.length; index++) {
    const item = state.previewWords[index];
    const next = state.previewWords[index + 1];
    const active = currentMs >= item.start_ms && currentMs < (next?.start_ms ?? item.end_ms + 2000);
    item.element.classList.toggle('active', active);
    if (active) activePhrase = item.phrase;
  }
  document.querySelectorAll('.phrase').forEach(node => node.classList.remove('phrase-active'));
  if (activePhrase) activePhrase.classList.add('phrase-active');
});

function runConversion() {
  const from = elements.fromFormat.value;
  const profile = elements.profile.value;
  const segment = elements.segment.checked;
  const common = { from, segment, profile };

  state.jsonText = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'json' });
  state.outputs.json = state.jsonText;
  state.outputs.txt = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'txt' });
  state.outputs.phrase = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'lrc', lrc_style: 'phrase' });
  state.outputs.word = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'lrc', lrc_style: 'apple-word' });
  state.outputs.srt = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'srt' });
  state.outputs.vtt = window.SyncLyricsHook.convert(state.inputText, { ...common, to: 'webvtt' });

  elements.plain.textContent = state.outputs.txt;
  elements.phrase.textContent = state.outputs.phrase;
  elements.word.textContent = state.outputs.word;
  elements.json.textContent = state.outputs.json;
  renderPreview(JSON.parse(state.jsonText));
}

function renderPreview(documentModel) {
  state.previewWords = [];
  elements.preview.innerHTML = '';
  for (const track of documentModel.tracks || []) {
    for (const cue of track.cues || []) {
      const phrase = document.createElement('div');
      phrase.className = 'phrase';
      const words = cue.words || [];
      if (words.length === 0) {
        phrase.textContent = cue.text;
      } else {
        for (const word of words) {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = word.text;
          span.addEventListener('click', () => {
            elements.audio.currentTime = word.start_ms / 1000;
            elements.audio.play();
          });
          phrase.appendChild(span);
          state.previewWords.push({ start_ms: word.start_ms, end_ms: word.end_ms, element: span, phrase });
        }
      }
      elements.preview.appendChild(phrase);
    }
  }
}

function detectFormat(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.lrc')) return 'lrc';
  if (lower.endsWith('.srt')) return 'srt';
  if (lower.endsWith('.vtt')) return 'webvtt';
  if (lower.endsWith('.ttml') || lower.endsWith('.xml')) return 'ttml';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.txt')) return 'txt';
  return null;
}

function extensionFor(key) {
  return { txt: 'txt', phrase: 'phrase.lrc', word: 'word.lrc', json: 'json' }[key] || 'txt';
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
