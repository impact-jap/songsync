import { copyText, downloadText } from '../utils/files.js';

export class PanelsView {
  constructor(outputs, buttons) {
    this.outputs = outputs;
    this.buttons = buttons;
    this.files = new Map();
  }

  setOutput(target, content, filename) {
    this.outputs[target].textContent = content || `No ${target} output.`;
    this.files.set(target, { content: content || '', filename });
    this.setTargetEnabled(target, Boolean(content));
  }

  bindActions() {
    for (const button of this.buttons.downloads) {
      button.addEventListener('click', () => {
        const target = button.dataset.target;
        const file = this.files.get(target);
        if (file) downloadText(file.filename, file.content);
      });
    }

    for (const button of this.buttons.copies) {
      button.addEventListener('click', async () => {
        const target = button.dataset.target;
        const file = this.files.get(target);
        if (file) await copyText(file.content.replace(/\n/g, '\\n'));
      });
    }
  }

  setTargetEnabled(target, enabled) {
    for (const button of [...this.buttons.downloads, ...this.buttons.copies]) {
      if (button.dataset.target === target) {
        button.disabled = !enabled;
      }
    }
  }
}
