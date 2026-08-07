const fs = require('fs');

const stylePath = 'public/css/style.css';
let styleCSS = fs.readFileSync(stylePath, 'utf8');

function extractStyles(filePath, componentName) {
    let content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/<style>([\s\S]*?)<\/style>/);
    if (match) {
        styleCSS += `\n/* =========================================\n   ${componentName}\n========================================= */\n`;
        styleCSS += match[1].trim() + '\n';
        content = content.replace(/<style>[\s\S]*?<\/style>/, '');
        fs.writeFileSync(filePath, content.trimStart());
        console.log(`Extracted styles from ${componentName}`);
    }
}

extractStyles('views/includes/navbar.ejs', 'Navbar Styles');
extractStyles('views/includes/footer.ejs', 'Footer Styles');

fs.writeFileSync(stylePath, styleCSS);
console.log('Navbar and Footer styles moved to style.css');
