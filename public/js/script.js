(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  // Button Ripple Effect
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const circle = document.createElement('span');
      circle.classList.add('ripple');
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;

      const diameter = Math.max(button.clientWidth, button.clientHeight);
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.marginLeft = circle.style.marginTop = `-${diameter/2}px`;

      this.appendChild(circle);

      setTimeout(() => {
        circle.remove();
      }, 600);
    });
  });

  // Skeleton Loader for Images
  // Ensure any image inside a .skeleton-loading container removes the shimmer when loaded
  document.addEventListener('DOMContentLoaded', () => {
    const skeletonImages = document.querySelectorAll('.skeleton-loading img');
    skeletonImages.forEach(img => {
      if (img.complete) {
        img.parentElement.classList.remove('skeleton-loading');
      } else {
        img.addEventListener('load', () => {
          img.parentElement.classList.remove('skeleton-loading');
        });
      }
    });
  });

})()