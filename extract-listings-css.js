const fs = require('fs');
const path = require('path');

const cssPath = 'public/css/listings.css';
let cssContent = '';

if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, 'utf8');
}

function extractStyles(filePath, componentName) {
    let content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<style>([\s\S]*?)<\/style>/);
    if (match) {
        cssContent += `\n/* =========================================\n   ${componentName}\n========================================= */\n`;
        cssContent += match[1].trim() + '\n';
        content = content.replace(/<style>[\s\S]*?<\/style>/, '');
        fs.writeFileSync(filePath, content.trimStart());
        console.log(`Extracted styles from ${componentName}`);
    }
}

extractStyles('views/listings/index.ejs', 'Index Styles');
extractStyles('views/listings/show.ejs', 'Show Styles');
extractStyles('views/listings/search.ejs', 'Search Styles');
extractStyles('views/listings/new.ejs', 'New Styles');
extractStyles('views/listings/edit.ejs', 'Edit Styles');

fs.writeFileSync(cssPath, cssContent);
console.log('Listings styles moved to listings.css');

// Now, link it in boilerplate.ejs
let boilerplate = fs.readFileSync('views/layouts/boilerplate.ejs', 'utf8');
if (!boilerplate.includes('listings.css')) {
    boilerplate = boilerplate.replace('<link rel="stylesheet" href="/css/style.css">', 
        '<link rel="stylesheet" href="/css/style.css">\n    <link rel="stylesheet" href="/css/listings.css">');
    fs.writeFileSync('views/layouts/boilerplate.ejs', boilerplate);
    console.log('Linked listings.css in boilerplate');
}
