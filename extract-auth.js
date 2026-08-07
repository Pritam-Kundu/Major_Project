const fs = require('fs');
const path = require('path');
const stylePath = 'public/css/style.css';
let styleCSS = fs.readFileSync(stylePath, 'utf8');

// Read login.ejs to get the auth styles
let loginContent = fs.readFileSync('views/users/login.ejs', 'utf8');
const match = loginContent.match(/<style>([\s\S]*?)<\/style>/);
if (match) {
    if (!styleCSS.includes('Auth Pages')) {
        styleCSS += '\n/* =========================================\n   Auth Pages (Login, Signup, etc.)\n========================================= */\n';
        styleCSS += match[1].trim() + '\n';
        fs.writeFileSync(stylePath, styleCSS);
        console.log('Auth styles moved to style.css');
    }
}

// Remove <style> tags from all user views
const usersDir = 'views/users';
const files = fs.readdirSync(usersDir).map(f => path.join(usersDir, f));
files.forEach(f => {
    if (f.endsWith('.ejs')) {
        let content = fs.readFileSync(f, 'utf8');
        // Only strip if it contains auth-split-container or similar auth styles
        if (content.includes('auth-split-container')) {
            content = content.replace(/<style>[\s\S]*?<\/style>/, '');
            fs.writeFileSync(f, content.trimStart());
            console.log(`Cleaned ${f}`);
        }
    }
});
console.log('Done');
