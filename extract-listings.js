const fs = require('fs');
const path = require('path');

const stylePath = 'public/css/style.css';
let styleCSS = fs.readFileSync(stylePath, 'utf8');

const listingsDir = 'views/listings';
const files = fs.readdirSync(listingsDir).map(f => path.join(listingsDir, f));

let extractedMedia = '\n/* =========================================\n   Listings Responsive Styles (Index, Show, Search)\n========================================= */\n';
let foundAny = false;

files.forEach(f => {
    if (f.endsWith('.ejs')) {
        let content = fs.readFileSync(f, 'utf8');
        
        // Find all @media blocks
        const mediaRegex = /@media\s*\([^{]+\)\s*\{([\s\S]*?})\s*}/g;
        let match;
        let hasMatches = false;
        
        while ((match = mediaRegex.exec(content)) !== null) {
            extractedMedia += `/* From ${path.basename(f)} */\n`;
            extractedMedia += match[0] + '\n\n';
            hasMatches = true;
            foundAny = true;
        }

        if (hasMatches) {
            // Remove the media blocks from the file
            content = content.replace(mediaRegex, '');
            fs.writeFileSync(f, content);
            console.log(`Extracted media queries from ${f}`);
        }
    }
});

if (foundAny) {
    fs.appendFileSync(stylePath, extractedMedia);
    console.log('Appended extracted media queries to style.css');
} else {
    console.log('No media queries found in listings.');
}
