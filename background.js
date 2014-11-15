chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    id: 'main',
    innerBounds: {
      width: 400,
      height: 500
    }
  });
});