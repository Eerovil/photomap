
function loadApp() {
    // Load the app
    showFirstImage();
}

function showFirstImage() {
    const firstImageId = window.database.images[0].id;
    const el = document.querySelector('#first-image');
    if (el) {
      el.src = localStorage.getItem(firstImageId);
      el.addEventListener('click', () => {
          startApp();
      })
    }
}

function startApp() {
    const setupEl = document.querySelector('#setup-container');
    setupEl.classList.add('hidden');
    const appEl = document.querySelector('#app-container');
    appEl.classList.remove('hidden');

    setMainImage(localStorage.getItem(window.database.images[0].id));
}

function setMainImage(src) {
    const el = document.querySelector('#main-image');
    el.src = src;
}