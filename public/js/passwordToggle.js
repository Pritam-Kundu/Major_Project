// Reusable script for toggling password visibility
(() => {
    'use strict';
  
    document.addEventListener('DOMContentLoaded', () => {
      // Find all password toggles
      const toggles = document.querySelectorAll('.password-toggle');
  
      toggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
          // Find the adjacent input field (should be the previous sibling or in the same parent)
          const input = this.previousElementSibling || this.parentElement.querySelector('input');
          
          if (input && (input.type === 'password' || input.type === 'text')) {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            // Toggle the eye icon classes
            if (type === 'text') {
              this.classList.remove('fa-eye');
              this.classList.add('fa-eye-slash');
            } else {
              this.classList.remove('fa-eye-slash');
              this.classList.add('fa-eye');
            }
          }
        });
      });
    });
})();
