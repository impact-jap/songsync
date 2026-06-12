export class StatusView {
  constructor(element) {
    this.element = element;
  }

  info(message) {
    this.element.classList.remove('is-error', 'is-ok');
    this.element.textContent = message;
  }

  ok(message) {
    this.element.classList.remove('is-error');
    this.element.classList.add('is-ok');
    this.element.textContent = message;
  }

  error(error) {
    this.element.classList.remove('is-ok');
    this.element.classList.add('is-error');
    this.element.textContent = error instanceof Error ? error.message : String(error);
  }
}
