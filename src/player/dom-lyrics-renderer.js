export class DomLyricsRenderer {
  constructor(stage, options = {}) {
    this.stage = stage;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.nodeElements = new Map();
    this.lineElements = new Map();
  }

  render(nodes) {
    this.nodeElements.clear();
    this.lineElements.clear();
    this.stage.textContent = '';

    const lines = groupNodesByCue(nodes);
    for (const line of lines) {
      const lineElement = document.createElement('p');
      lineElement.className = 'karaoke-line';
      lineElement.dataset.cueId = line.cueId;

      for (const node of line.nodes) {
        const token = document.createElement('span');
        token.className = 'karaoke-token';
        token.textContent = node.text || '';
        token.dataset.nodeId = node.id;
        token.dataset.startMs = String(node.start_ms ?? 0);
        token.addEventListener('click', () => this.onNodeClick(node.id));
        lineElement.appendChild(token);
        this.nodeElements.set(node.id, token);
      }

      this.stage.appendChild(lineElement);
      this.lineElements.set(line.cueId, lineElement);
    }
  }

  update(cursorState) {
    const activeNodeId = cursorState.active_node_id || cursorState.active_word_id || cursorState.active_cue_id;
    const activeCueId = cursorState.active_cue_id;

    for (const [nodeId, element] of this.nodeElements) {
      const isActive = nodeId === activeNodeId;
      element.classList.toggle('is-active', isActive);
      element.classList.toggle('is-later', !isActive && Number(element.dataset.startMs || 0) < Number(cursorState.time_ms || 0));
    }

    for (const [cueId, element] of this.lineElements) {
      const isActive = cueId === activeCueId;
      element.classList.toggle('is-active', isActive);
      if (isActive) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
  }
}

function groupNodesByCue(nodes) {
  const groups = new Map();
  for (const node of nodes || []) {
    const cueId = node.cue_id || node.parent_id || node.id;
    if (!groups.has(cueId)) groups.set(cueId, []);
    groups.get(cueId).push(node);
  }
  return Array.from(groups, ([cueId, lineNodes]) => ({ cueId, nodes: lineNodes }));
}
