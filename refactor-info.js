const fs = require('fs');
const path = require('path');
const stylePath = 'public/css/style.css';
let styleCSS = fs.readFileSync(stylePath, 'utf8');

if (!styleCSS.includes('Informational Pages')) {
    styleCSS += `
/* =========================================
   Informational Pages (Privacy, Terms, About, etc.)
========================================= */
@media (max-width: 992px) {
    .hero-content h1 {
        font-size: 2.8rem !important;
    }
    .privacy-overview, .website-wrapper, .principle-wrapper, .management-wrapper, 
    .checklist-grid, .preview-wrapper, .sharing-wrapper, .cookie-wrapper, 
    .payment-wrapper, .checklist-wrapper, .safety-wrapper, .legal-wrapper {
        grid-template-columns: 1fr !important;
    }
    .team-card {
        width: 100% !important;
        max-width: 420px !important;
    }
    .retention-box, .transfer-box {
        flex-direction: column !important;
    }
}

@media (max-width: 768px) {
    .update-box, .notice-box, .statement-box, .timeline-item, .changes-box, .newsletter-form, .contact-buttons {
        flex-direction: column !important;
    }
    .notice-box {
        text-align: left !important;
    }
    .privacy-contact h2, .cookie-contact h2, .gift-cta h2, .press-contact h2, .support-section h2, .newsletter h2 {
        font-size: 2.2rem !important;
    }
    .about-content h1 {
        font-size: 2.5rem !important;
    }
}
`;
    fs.writeFileSync(stylePath, styleCSS);
}

const files = fs.readdirSync('views/pages').map(f => path.join('views/pages', f));
files.forEach(f => {
    if (f.endsWith('.ejs')) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/@media\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\}/g, '');
        fs.writeFileSync(f, content);
    }
});

console.log('Refactoring complete');
