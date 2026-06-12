import { AppController } from './app/app-controller.js';

const app = new AppController();
app.boot().catch(error => {
  console.error(error);
  const fallback = document.querySelector('#status-line');
  if (fallback) {
    fallback.classList.add('is-error');
    fallback.textContent = error.message;
  }
});
