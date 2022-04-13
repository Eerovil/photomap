// Client ID and API key from the Developer Console
var CLIENT_ID = '734651298434-hdjqj6lrkpjqj54lc8fap09rj0qsuiji.apps.googleusercontent.com';
var API_KEY = 'AIzaSyCgqebadAFjiHYyTHIzNmTKLNynlPsoCmg';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive' //.appdata https://www.googleapis.com/auth/drive.file';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    // listFiles();
    initRootFolder().then(() => {
      initDatabase().then(() => {
        loadDatabase().then(() => {
          initImagesFolder().then(() => {
            loadImages();
          });
        });
      });
    })
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
 * Print files.
 */
function listFiles() {
  gapi.client.drive.files.list({
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name)"
  }).then(function(response) {
    appendPre('Files:');
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        appendPre(file.name + ' (' + file.id + ')');
      }
    } else {
      appendPre('No files found.');
    }
  });
}

/**
 * Create folder for this app called "PhotoMap"
 */
function initRootFolder() {
  // Chec if folder exists
  return gapi.client.drive.files.list({
    'q': "name = 'PhotoMap'",
    'pageSize': 1,
    'fields': "nextPageToken, files(id, name)"
  }).then(function(response) {
    var files = response.result.files;
    if (files && files.length > 0) {
      // Folder exists
      // Get folder ID
      var folderId = files[0].id;
      console.log("Folder exists, ID: " + folderId);
      localStorage.setItem('folderId', folderId);
    } else {
      return gapi.client.drive.files.create({
          'name': 'PhotoMap',
          'mimeType': 'application/vnd.google-apps.folder'
      }).then(function(response) {
          var folderId = response.result.id;
          localStorage.setItem('folderId', folderId);
          console.log("Folder created, ID: " + folderId);
      });
    }
  })
}


/**
 * Create folder for images called "images"
 */
function initImagesFolder() {
  // Check if file exists
  return gapi.client.drive.files.list({
    'q': "name = 'images' and '" + localStorage.getItem('folderId') + "' in parents",
    'pageSize': 1,
    'fields': "nextPageToken, files(id, name)"
  }).then(function(response) {
    var files = response.result.files;
    if (files && files.length > 0) {
      // Folder exists
      // Get folder ID
      var folderId = files[0].id;
      console.log("Folder exists, ID: " + folderId);
      localStorage.setItem('imagesFolderId', folderId);
    } else {
      return gapi.client.drive.files.create({
          'name': 'images',
          'parents': [localStorage.getItem('folderId')],
          'mimeType': 'application/vnd.google-apps.folder'
      }).then(function(response) {
          var folderId = response.result.id;
          localStorage.setItem('imagesFolderId', folderId);
          console.log("Folder created, ID: " + folderId);
      });
    }
  })
}

/**
 * Load all files in images folder and get their webContentLink
 */
function loadImages() {
  const folderId = localStorage.getItem('imagesFolderId');
  return gapi.client.drive.files.list({
    'q': "'" + folderId + "' in parents",
    'pageSize': 10,
    'fields': "nextPageToken, files(id, name, webContentLink)"
  }).then(function(response) {
    const files = response.result.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        localStorage.setItem(file.id, file.webContentLink);
        console.log("File loaded: " + file.id);
        if (i == 0) {
          loadApp();
        }
      }
    }
  });
}



/**
 * Create a json file in root folder called "database.json"
 */
function initDatabase() {
  // Check if file exists
  return gapi.client.drive.files.list({
    'q': "name = 'database.json'",
    'pageSize': 1,
    'fields': "nextPageToken, files(id, name)"
  }).then(function(response) {
    var files = response.result.files;
    if (files && files.length > 0) {
      // File exists
      // Get file ID
      var fileId = files[0].id;
      console.log("File exists, ID: " + fileId);
      localStorage.setItem('dbFileId', fileId);
    } else {
      // Create file
      return gapi.client.drive.files.create({
          'name': 'database.json',
          'parents': [localStorage.getItem('folderId')],
          'mimeType': 'application/json'
      }).then(function(response) {
          var fileId = response.result.id;
          localStorage.setItem('dbFileId', fileId);
          console.log("File created, ID: " + fileId);
      });
    }
  })
}

/**
 * Load database.json file
 */
function loadDatabase() {
  return gapi.client.drive.files.get({
    'fileId': localStorage.getItem('dbFileId'),
    'alt': 'media'
  }).then(function(response) {
    var json = response.result;
    console.log("Database loaded: " + JSON.stringify(json));
    window.database = json || {};
  });
}

/**
 * Save database.json file from 'db' variable
 */
function saveDatabase() {
  var db = window.database;
  return gapi.client.request({
    'path': '/upload/drive/v3/files/' + localStorage.getItem('dbFileId'),
    'method': 'PATCH',
    'params': {'uploadType': 'media'},
    'headers': {'Content-Type': 'application/json'},
    'body': db
  }).then(function(response) {
    console.log(response);
  });
}
