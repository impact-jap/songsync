export class CanvasLyricsRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.nodes = [];
  }

  render(nodes) {
    this.nodes = nodes || [];
    this.paint({});
  }

  update(cursorState) {
    this.paint(cursorState || {});
  }

  paint(cursorState) {
    const canvas = this.canvas;
    const ctx = this.context;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const activeId = cursorState.active_node_id || cursorState.active_word_id || cursorState.active_cue_id;
    const visible = this.nodes.slice(0, 32);
    const text = visible.map(node => node.text || '').join(' ');
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(text || 'Canvas renderer', rect.width / 2, rect.height / 2);

    if (activeId) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`active: ${activeId}`, rect.width / 2, rect.height / 2 + 34);
    }
  }
}
