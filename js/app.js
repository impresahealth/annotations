let canvas = new fabric.Canvas('annotation-canvas');
let isPDF = false;

document.addEventListener('DOMContentLoaded', function() {

  const fileInput = document.getElementById('file-upload');
  const nextPageBtn = document.getElementById('next-page');
  const prevPageBtn = document.getElementById('prev-page');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const pageDisplay = document.getElementById('page-display');
  let currentPage = 1;
  let totalPages = 0;
  let zoomLevel = 1.0;

  // File upload logic
  if (fileInput) {
      fileInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (!file) return;

          const fileType = file.type;
          if (fileType === 'application/pdf') {
              renderPDF(file, canvas, updatePageDisplay);
          } else if (fileType.startsWith('image/')) {
              renderImage(file, canvas);
          } else {
              alert('Unsupported file type. Please upload a PDF or image file.');
          }
      });
  }

  // Debounced zoom functions
  const debouncedZoomIn = debounce(() => {
      zoomLevel += 0.2;
      renderPage(currentPage, canvas);
  }, 200);

  const debouncedZoomOut = debounce(() => {
      zoomLevel -= 0.2;
      renderPage(currentPage, canvas);
  }, 200);

  if (zoomInBtn) {
      zoomInBtn.addEventListener('click', debouncedZoomIn);
  }

  if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', debouncedZoomOut);
  }

  // Page navigation
  if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
              currentPage++;
              renderPage(currentPage, canvas);
              updatePageDisplay();
          }
      });
  }

  if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
          if (currentPage > 1) {
              currentPage--;
              renderPage(currentPage, canvas);
              updatePageDisplay();
          }
      });
  }

  function updatePageDisplay() {
      pageDisplay.innerText = `Page ${currentPage} of ${totalPages}`;
  }
});

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
