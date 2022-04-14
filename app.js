
function loadApp() {
    // Load the app
    const elem = document.querySelector('#main-image .img-container')
    window.panzoom = Panzoom(elem, {
        maxScale: 5,
        contain: "outside",
    })
    elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
    showFirstImage();
    window.breadCrumbs = [];
}

function showFirstImage() {
    const firstImageId = Object.keys(window.database.images)[0];
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

    setMainImage(window.database.images[Object.keys(window.database.images)[0]]);
}

function drawLinks() {
    const links = document.querySelectorAll('#main-image .img-container .link');
    // Delete existing links
    links.forEach(link => {
        link.remove();
    });
    for (const link of (window.mainImage.links || [])) {
        const el = document.createElement('div');
        el.classList.add('link');
        el.innerHTML = '<h2>LINK</h2>';
        el.style.top = link.top + 'vh';
        el.style.left = link.left + 'vh';
        el.addEventListener('click', () => {
            setMainImage(window.database.images[link.id]);
        });
        document.querySelector('#main-image .img-container').appendChild(el);
    }
}

function drawBackButton() {
    for (const existing of document.querySelectorAll('#overlay .link')) {
        // delete
        existing.remove();
    }
    if (window.breadCrumbs.length < 2) {
        console.log("cant go back")
        return;
    }
    const el = document.createElement('div');
    el.classList.add('link');
    el.innerHTML = '<h2>BACK</h2>';
    el.style.top = '1%';
    el.style.left = '1%';
    el.addEventListener('click', () => {
        window.breadCrumbs.pop();
        setMainImage(window.breadCrumbs.pop());
    });
    document.querySelector('#overlay').appendChild(el);
}

function refreshOverlay() {
    drawLinks();
    drawBackButton();
}

function setMainImage(image) {
    window.mainImage = image;
    const id = image.id;
    const src = localStorage.getItem(id);
    const el = document.querySelector('#main-image img');
    el.src = src;
    window.breadCrumbs.push(window.mainImage);
    refreshOverlay();
}


function startCamera() {
    const video = document.querySelector('#camera video');
    const canvas = window.canvas = document.querySelector('#camera canvas');
    canvas.width = 480;
    canvas.height = 360;

    const button = document.querySelector('#camera button');
    button.onclick = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    const constraints = {
        audio: false,
        video: true
    };

    function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;
    }

    function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}