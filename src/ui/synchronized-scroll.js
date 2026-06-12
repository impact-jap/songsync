export class SynchronizedScroll {
  constructor(elements) {
    this.elements = elements;
    this.locked = false;
  }

  bind() {
    for (const element of this.elements) {
      element.addEventListener('scroll', () => this.syncFrom(element), { passive: true });
    }
  }

  syncFrom(source) {
    if (this.locked) return;
    this.locked = true;
    for (const element of this.elements) {
      if (element !== source) {
        element.scrollTop = source.scrollTop;
        element.scrollLeft = source.scrollLeft;
      }
    }
    this.locked = false;
  }
}
