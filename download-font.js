const fs = require('fs');
const path = require('path');
const https = require('https');

const fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf';
const destDir = path.join(__dirname, 'assets', 'fonts');
const destPath = path.join(destDir, 'NotoSansKannada-Regular.ttf');

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Handle HTTP Redirects
        download(res.headers.location, filePath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download (Status Code: ${res.statusCode})`));
        return;
      }
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// Ensure directory layout exists
fs.mkdirSync(destDir, { recursive: true });

console.log('Initiating Noto Sans Kannada font download...');
download(fontUrl, destPath)
  .then(() => {
    console.log('Noto Sans Kannada Font asset saved to: ' + destPath);
  })
  .catch((err) => {
    console.error('Failed to download Noto Sans Kannada font:', err.message);
    console.log('Will retry or use fallback mechanism.');
  });
