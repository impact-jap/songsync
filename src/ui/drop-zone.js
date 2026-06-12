export class DropZone {
  constructor(root, onFiles) {
    this.root = root;
    this.onFiles = onFiles;
  }

  bind() {
    this.root.addEventListener('dragover', event => {
      event.preventDefault();
      this.root.classList.add('is-drop-target');
    });

    this.root.addEventListener('dragleave', () => {
      this.root.classList.remove('is-drop-target');
    });

    this.root.addEventListener('drop', event => {
      event.preventDefault();
      this.root.classList.remove('is-drop-target');
      this.onFiles(Array.from(event.dataTransfer?.files || []));
    });
  }
}
