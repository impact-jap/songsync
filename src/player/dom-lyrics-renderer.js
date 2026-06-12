const DEFAULT_VISIBLE_RADIUS = 1;

export class DomLyricsRenderer {
  constructor(stage, options = {}) {
    this.stage = stage;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.visibleRadius = Number(options.visibleRadius ?? DEFAULT_VISIBLE_RADIUS);
    this.nodeElements = new Map();
    this.lineElements = new Map();
    this.groups = [];
    this.cueIndex = new Map();
    this.nodeToCueIndex = new Map();
    this.displayType = 'word';
    this.renderedActiveIndex = -1;
  }

  render(nodes, options = {}) {
    this.displayType = normalizeDisplayType(options.granularity || 'word');
    this.nodeElements.clear();
    this.lineElements.clear();
    this.cueIndex.clear();
    this.nodeToCueIndex.clear();
    this.stage.textContent = '';

    const displayNodes = selectDisplayNodes(nodes, this.displayType);
    this.groups = groupNodesByCue(displayNodes);

    this.groups.forEach((group, index) => {
      this.cueIndex.set(group.cueId, index);
      for (const node of group.nodes) {
        this.nodeToCueIndex.set(String(node.id), index);
      }
    });

    this.renderedActiveIndex = -1;
    this.renderWindow(0);
  }

  update(cursorState = {}) {
    if (this.groups.length === 0) return;

    const activeIndex = this.findActiveIndex(cursorState);
    if (activeIndex !== this.renderedActiveIndex) {
      this.renderWindow(activeIndex);
    }

    const activeNodeId = this.resolveActiveNodeId(cursorState);
    const timeMs = Number(cursorState.time_ms || 0);

    for (const [nodeId, element] of this.nodeElements) {
      const startMs = Number(element.dataset.startMs || 0);
      const isActive = activeNodeId === nodeId;
      element.classList.toggle('is-active', isActive);
      element.classList.toggle('is-past', !isActive && startMs > 0 && startMs < timeMs);
    }
  }

  renderWindow(activeIndex) {
    const safeActiveIndex = clamp(activeIndex, 0, Math.max(0, this.groups.length - 1));
    const firstIndex = Math.max(0, safeActiveIndex - this.visibleRadius);
    const lastIndex = Math.min(this.groups.length - 1, safeActiveIndex + this.visibleRadius);

    this.nodeElements.clear();
    this.lineElements.clear();
    this.stage.textContent = '';

    for (let index = firstIndex; index <= lastIndex; index++) {
      const group = this.groups[index];
      const lineElement = this.createLineElement(group, index, safeActiveIndex);
      this.stage.appendChild(lineElement);
      this.lineElements.set(group.cueId, lineElement);
    }

    this.renderedActiveIndex = safeActiveIndex;
  }

  createLineElement(group, index, activeIndex) {
    const lineElement = document.createElement('p');
    lineElement.className = 'karaoke-line';
    lineElement.dataset.cueId = group.cueId;
    lineElement.classList.toggle('is-before', index < activeIndex);
    lineElement.classList.toggle('is-active', index === activeIndex);
    lineElement.classList.toggle('is-after', index > activeIndex);

    let previousText = '';
    for (const node of group.nodes) {
      const text = String(node.text || '');
      if (shouldInsertSpace(previousText, text)) {
        lineElement.appendChild(document.createTextNode(' '));
      }

      const token = document.createElement('span');
      token.className = 'karaoke-token';
      token.textContent = text;
      token.dataset.nodeId = String(node.id);
      token.dataset.startMs = String(node.start_ms ?? group.startMs ?? 0);
      token.addEventListener('click', () => this.onNodeClick(String(node.id)));
      lineElement.appendChild(token);
      this.nodeElements.set(String(node.id), token);

      previousText = text;
    }

    return lineElement;
  }

  findActiveIndex(cursorState) {
    const activeCueId = normalizeCueId(cursorState.active_cue_id);
    if (activeCueId && this.cueIndex.has(activeCueId)) {
      return this.cueIndex.get(activeCueId);
    }

    const activeNodeId = this.resolveActiveNodeId(cursorState);
    if (activeNodeId && this.nodeToCueIndex.has(activeNodeId)) {
      return this.nodeToCueIndex.get(activeNodeId);
    }

    const derivedCueId = cueIdFromNodeId(activeNodeId);
    if (derivedCueId && this.cueIndex.has(derivedCueId)) {
      return this.cueIndex.get(derivedCueId);
    }

    const timeMs = Number(cursorState.time_ms || 0);
    if (Number.isFinite(timeMs) && timeMs > 0) {
      const exactIndex = this.groups.findIndex(group => timeMs >= group.startMs && timeMs <= group.endMs);
      if (exactIndex >= 0) return exactIndex;

      let closestIndex = 0;
      for (let index = 0; index < this.groups.length; index++) {
        if (this.groups[index].startMs <= timeMs) closestIndex = index;
      }
      return closestIndex;
    }

    return 0;
  }

  resolveActiveNodeId(cursorState) {
    if (this.displayType === 'phrase') {
      return normalizeCueId(cursorState.active_cue_id) || cueIdFromNodeId(cursorState.active_node_id);
    }

    if (this.displayType === 'word') {
      return normalizeWordId(cursorState.active_word_id || cursorState.active_node_id);
    }

    return normalizeNodeId(cursorState.active_node_id || cursorState.active_word_id);
  }
}

function selectDisplayNodes(nodes, preferredType) {
  const allNodes = Array.isArray(nodes) ? nodes : [];
  const preferred = allNodes.filter(node => classifyNode(node) === preferredType);
  if (preferred.length > 0) return preferred;

  const words = allNodes.filter(node => classifyNode(node) === 'word');
  if (words.length > 0) return words;

  const phrases = allNodes.filter(node => classifyNode(node) === 'phrase');
  if (phrases.length > 0) return phrases;

  return allNodes.filter(node => classifyNode(node) !== 'unknown');
}

function groupNodesByCue(nodes) {
  const groups = new Map();

  for (const node of nodes || []) {
    const cueId = normalizeCueId(node.cue_id || cueIdFromNodeId(node.id) || node.parent_id || node.id);
    if (!groups.has(cueId)) {
      groups.set(cueId, {
        cueId,
        startMs: Number(node.start_ms ?? 0),
        endMs: Number(node.end_ms ?? node.start_ms ?? 0),
        nodes: []
      });
    }

    const group = groups.get(cueId);
    group.startMs = Math.min(group.startMs, Number(node.start_ms ?? group.startMs));
    group.endMs = Math.max(group.endMs, Number(node.end_ms ?? node.start_ms ?? group.endMs));
    group.nodes.push(node);
  }

  return Array.from(groups.values()).sort((left, right) => left.startMs - right.startMs);
}

function classifyNode(node) {
  const id = String(node?.id || '');
  if (!id) return 'unknown';
  if (/-g-\d+$/i.test(id)) return 'grapheme';
  if (/-w-\d+$/i.test(id)) return 'word';
  return 'phrase';
}

function normalizeDisplayType(value) {
  if (value === 'phrase') return 'phrase';
  if (value === 'grapheme') return 'grapheme';
  return 'word';
}

function normalizeNodeId(value) {
  return value == null ? '' : String(value);
}

function normalizeWordId(value) {
  const id = normalizeNodeId(value);
  return id.replace(/-g-\d+$/i, '');
}

function normalizeCueId(value) {
  const id = normalizeNodeId(value);
  return id.replace(/-w-\d+(?:-g-\d+)?$/i, '');
}

function cueIdFromNodeId(value) {
  const id = normalizeNodeId(value);
  if (!id) return '';
  return id.replace(/-w-\d+(?:-g-\d+)?$/i, '');
}

function shouldInsertSpace(previousText, currentText) {
  if (!previousText || !currentText) return false;
  if (/^\s/.test(currentText) || /\s$/.test(previousText)) return false;
  if (/^[,.;:!?)]/.test(currentText)) return false;
  if (/[(\[]$/.test(previousText)) return false;
  if (containsCjk(previousText) || containsCjk(currentText)) return false;
  if (previousText.length === 1 && currentText.length === 1) return false;
  return true;
}

function containsCjk(value) {
  return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
