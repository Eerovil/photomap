
function loadApp() {
    // Load the app
    const elem = document.querySelector('#main-image .img-container-container')
    const imgEl = document.querySelector('#main-image .img-container img')
    imgEl.addEventListener('load', () => {
        const loadingElem = document.querySelector('#loading');
        loadingElem.classList.add('hidden');
        window.panzoom.zoom(0.5)
        setTimeout(() => {
            window.panzoom.pan((window.innerWidth / 2) - (imgEl.offsetWidth / 2), 0)
        }, 100)
    })
    window.panzoom = Panzoom(elem, {
        maxScale: 3,
        contain: "outside",
    })
    elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
    window.breadCrumbs = [];
    window.visitedLinks = new Set();
    showFirstImage();
}

function showFirstImage() {
    setTimeout(() => {
        startApp();
    }, 500)
}

function startApp() {
    const setupEl = document.querySelector('#setup-container');
    setupEl.classList.add('hidden');
    const appEl = document.querySelector('#app-container');
    appEl.classList.remove('hidden');

    if (Object.keys(window.database.images).length > 0) {
        setMainImage(window.database.images[Object.keys(window.database.images)[0]]);
    } else {
        window.newImage = {};
        startCamera();
    }
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
        if (window.visitedLinks.has(link.id)) {
            el.classList.add('visited');
        }
        el.style.top = `calc(${link.top - 1.0}vh - 25px)`;
        el.style.left = `calc(${link.left - 1.0}vh - 35px)`;
        el.addEventListener('click', () => {
            setMainImage(window.database.images[link.id]);
        });
        document.querySelector('#main-image .img-container').appendChild(el);
    }
}

function deleteImgAndChildren(img) {
    if (img.links) {
        img.links.forEach(link => {
            deleteImgAndChildren(window.database.images[link.id]);
        });
    }
    driveDeleteImage(img.id);
    delete window.database[img.id];
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
        el.innerHTML = '<h2 class="backbutton"> <-- BACK</h2>';
        el.addEventListener('click', () => {
            window.breadCrumbs.pop();
            setMainImage(window.breadCrumbs.pop());
            refreshOverlay();
        });
        document.querySelector('#overlay').appendChild(el);
    }

    // check for edit=1 query param
    if (window.location.search.indexOf('edit=1') === -1) {
        return
    }

    el = document.createElement('div');
    el.innerHTML = '<h2>DELETE</h2>';
    el.addEventListener('click', () => {
        if (confirm('Poista kuva?')) {
            deleteImgAndChildren(window.mainImage);
            const parent = window.breadCrumbs[window.breadCrumbs.length - 2];
            if (parent) {
                // Delete link
                parent.links = (parent.links || []).filter(link => link.id !== window.mainImage.id);
            }

            saveDatabase();
            if (window.breadCrumbs.length > 1) {
                window.breadCrumbs.pop();
            }
            setMainImage(window.breadCrumbs.pop());
            drawLinks();
            refreshOverlay();
        }
    });
    document.querySelector('#overlay').appendChild(el);

    if (!window.cameraMode) {
        el = document.createElement('div');
        el.innerHTML = '<h2>NEW</h2>';
        el.addEventListener('click', () => {
            window.cameraMode = 'location';
            const elem = document.querySelector('#main-image .img-container')
            const startCameraCallback = (event) => {
                // get the location where user clicked
                const top = (event.offsetY / window.innerHeight) * 100.0;
                const left = (event.offsetX / window.innerHeight) * 100.0;
                window.newImage = {
                    top: top,
                    left: left,
                }
                startCamera();
                // clear eventlistener
                elem.removeEventListener('click', startCameraCallback);
            }
            elem.addEventListener('click', startCameraCallback)
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

function getImageURL(id) {
    return `https://drive.google.com/uc?id=${id}&export=download`;
}

function setMainImage(image) {
    if (!image) {
        return;
    }
    window.panzoom.zoom(0.5)
    // Check if all image.links id are in window.visitedLinks
    const allLinksInVisited = (
        (image.links || []).length === 0 ||
        (image.links || []).every(link => window.visitedLinks.has(link.id))
    );
    if (allLinksInVisited) {
        window.visitedLinks.add(image.id);
    }

    window.mainImage = image;
    const id = image.id;
    const src = getImageURL(id);
    if (!src) {
        // Try again after a while
        setTimeout(() => {
            setMainImage(image)
        }, 500)
        return;
    }
    const el = document.querySelector('#main-image img');
    el.src = src;
    window.breadCrumbs.push(window.mainImage);
    if (image.links && image.links.length > 0) {
        preloadImages(image.links.map(link => getImageURL(link.id)))
    }
    refreshOverlay();

    const loadingElem = document.querySelector('#loading');
    loadingElem.classList.remove('hidden');
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
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataurl = canvas.toDataURL('image/jpeg', 1.0);
            driveSaveImage(dataurl).then(imageId => {
                window.newImage.id = imageId;
                if (window.mainImage) {
                    const links = window.database.images[window.mainImage.id].links || [];
                    links.push({
                        id: imageId,
                        top: window.newImage.top,
                        left: window.newImage.left,
                    })
                }
                window.database.images[imageId] = {
                    id: imageId,
                    links: [],
                }
                saveDatabase();
                drawLinks();
            })
            cameraContainer.classList.add('hidden');
            window.cameraMode = false;
            refreshOverlay();
        }, 1000)
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