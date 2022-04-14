
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

function drawOverlayButtons() {
    for (const existing of document.querySelectorAll('#overlay div')) {
        // delete all first
        existing.remove();
    }
    if (window.cameraMode) {
        return;
    }
    let el;
    if (window.breadCrumbs.length > 1) {
        // back button
        el = document.createElement('div');
        el.innerHTML = '<h2>BACK</h2>';
        el.addEventListener('click', () => {
            window.breadCrumbs.pop();
            setMainImage(window.breadCrumbs.pop());
        });
        document.querySelector('#overlay').appendChild(el);
    }
    // Dragging mode button
    if (!window.draggingMode) {
        el = document.createElement('div');
        el.innerHTML = '<h2>DRAG</h2>';
        el.addEventListener('click', () => {
            window.draggingMode = true;
            refreshOverlay();
        });
        document.querySelector('#overlay').appendChild(el);
    } else {
        el = document.createElement('div');
        el.innerHTML = '<h2>STOP DRAG</h2>';
        el.addEventListener('click', () => {
            window.draggingMode = false;
            refreshOverlay();
        });
        document.querySelector('#overlay').appendChild(el);
    }

    if (!window.cameraMode) {
        el = document.createElement('div');
        el.innerHTML = '<h2>NEW</h2>';
        el.addEventListener('click', () => {
            window.cameraMode = 'location';
            const elem = document.querySelector('#main-image .img-container')
            elem.addEventListener('click', (event) => {
                // get the location where user clicked
                const top = (event.offsetY / window.innerHeight) * 100.0;
                const left = (event.offsetX / window.innerHeight) * 100.0;
                window.newImage = {
                    top: top,
                    left: left,
                }
                startCamera();
            })
            refreshOverlay();
        });
        document.querySelector('#overlay').appendChild(el);
    }
    if (window.cameraMode == 'location') {
        el = document.createElement('div');
        el.innerHTML = '<h2>WHERE?</h2>';
        document.querySelector('#overlay').appendChild(el);
    }
}

function refreshOverlay() {
    drawLinks();
    drawOverlayButtons();
}

function preloadImages(urls) {
    return Promise.all(
        urls.map(
            (a) =>
                new Promise((res) => {
                    const preloadImage = new Image();
                    preloadImage.onload = res;
                    preloadImage.src = a;
                })
        )
    );
}

function setMainImage(image) {
    window.mainImage = image;
    const id = image.id;
    const src = localStorage.getItem(id);
    const el = document.querySelector('#main-image img');
    el.src = src;
    window.breadCrumbs.push(window.mainImage);
    if (image.links && image.links.length > 0) {
        preloadImages(image.links.map(link => localStorage.getItem(link.id)))
    }
    refreshOverlay();
}


function startCamera() {
    window.cameraMode = 'camera';
    const cameraContainer = document.querySelector('#camera');
    cameraContainer.classList.remove('hidden');
    const video = document.querySelector('#camera video');
    const canvas = window.canvas = document.querySelector('#camera canvas');
    canvas.width = 480;
    canvas.height = 360;

    const button = document.querySelector('#camera button');
    button.onclick = function() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataurl = canvas.toDataURL('image/jpeg', 1.0);
        driveSaveImage(dataurl).then(imageId => {
            window.newImage.id = imageId;
            const links = window.database.images[window.mainImage.id].links || [];
            links.push({
                id: imageId,
                top: window.newImage.top,
                left: window.newImage.left,
            })
            window.database.images[imageId] = {
                id: imageId,
                links: [],
            }
            saveDatabase();
        })
        cameraContainer.classList.add('hidden');
        window.cameraMode = false;
        refreshOverlay();
    };

    const constraints = {
        audio: false,
        video: { facingMode: "environment" },

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