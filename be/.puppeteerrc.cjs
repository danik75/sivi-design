const { join } = require('path');

// Download Chromium into a project-local cache so the browser fetched during
// `npm ci` (postinstall) ships inside the built image and is found at runtime.
// The default (~/.cache/puppeteer) can live outside the app dir and go missing
// between the build and run stages on Railway/nixpacks.
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
