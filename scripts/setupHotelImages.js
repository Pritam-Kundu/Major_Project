const fs = require('fs');
const path = require('path');
const https = require('https');

const categories = [
  'luxury', 'budget', 'business', 'resort', 'villa', 
  'camping', 'homestay', 'hostel', 'beach', 'mountain', 'hotel'
];

const IMAGES_PER_CATEGORY = 10;

// Helper to download an image with redirect handling
function downloadImage(url, dest, retryCount = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        let redirectUrl = res.headers.location;
        // Sometimes loremflickr returns relative redirects like /cache/...
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        
        if (retryCount > 5) {
          return reject(new Error('Too many redirects'));
        }
        return downloadImage(redirectUrl, dest, retryCount + 1).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function setup() {
  const baseDir = path.join(__dirname, '..', 'public', 'images', 'hotels');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  console.log("Downloading RELEVANT, unique placeholder images for each category using LoremFlickr...");
  
  let totalDownloads = 0;
  let failCount = 0;
  
  for (const category of categories) {
    const catPath = path.join(baseDir, category);
    
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }
    
    const downloadPromises = [];
    
    for (let i = 1; i <= IMAGES_PER_CATEGORY; i++) {
      const destPath = path.join(catPath, `${category}_image_${i}.jpg`);
      
      // Use LoremFlickr with category-specific keywords and a unique lock ID to get distinct, relevant images!
      const keywords = category === 'hotel' ? 'hotel,room' : `hotel,${category}`;
      // A unique lock ID ensures we don't get the same random image twice
      const lockId = Math.floor(Math.random() * 10000) + (i * 1000); 
      const url = `https://loremflickr.com/800/600/${keywords}/all?lock=${lockId}`;
      
      downloadPromises.push(
        downloadImage(url, destPath)
          .then(() => { totalDownloads++; })
          .catch(err => {
             console.error(`Error downloading ${destPath}:`, err.message);
             failCount++;
          })
      );
    }
    
    // Wait for all 10 images in this category to download before moving to the next
    // to avoid slamming the network with 110 parallel requests at once.
    await Promise.all(downloadPromises);
    console.log(`Downloaded ${IMAGES_PER_CATEGORY} relevant images for: ${category}`);
  }
  
  console.log(`\nSetup Complete! Downloaded ${totalDownloads} relevant, distinct placeholder images.`);
  if (failCount > 0) {
    console.log(`Warning: ${failCount} downloads failed.`);
  }
  console.log("The hotels will now all have completely distinct AND relevant images! Remember to hard refresh your browser.");
}

setup().catch(console.error);
