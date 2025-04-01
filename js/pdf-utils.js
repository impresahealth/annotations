// pdf-utils.js

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
let pdfDoc = null;
let originalPdfBytes = null;
let totalPages = 0;
let currentPage = 1;
let zoomLevel = 1.0;
let pageAnnotations = {};
let isPDF = false; // 🔥 Moved to correct spot!

// Load a PDF file into canvas
function renderPDF(file, canvas, updatePageDisplay) {
  PDFState.isPDF = true;
  if (typeof resetCanvas === 'function') {
    resetCanvas(canvas);
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    const typedArray = new Uint8Array(event.target.result);
    originalPdfBytes = typedArray;

    pdfjsLib.getDocument(typedArray).promise
      .then(function (pdf) {
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;
        console.log("📄 PDF loaded:", totalPages, "pages");
        renderPage(currentPage, canvas);
        updatePageDisplay(totalPages, currentPage);
      })
      .catch(err => console.error("❌ Error loading PDF:", err));
  };
  reader.readAsArrayBuffer(file);
}

function renderPage(pageNumber, canvas) {
  pdfDoc.getPage(pageNumber).then(function (page) {
    const viewport = page.getViewport({ scale: 1.0 }); // Always start with 100% scale
    canvas.setWidth(viewport.width);
    canvas.setHeight(viewport.height);

    // Save original size for later export if needed
    PDFState.viewportSize = {
      width: viewport.width,
      height: viewport.height
    };
    PDFState.zoomLevel = 1.0;

    // Temporary canvas for PDF rendering
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Render the page to the temporary canvas
    page.render({ canvasContext: tempCtx, viewport }).promise.then(() => {
      const imgDataUrl = tempCanvas.toDataURL('image/png');

      // 💥 Always clear canvas before setting background
      canvas.clear();

      // Set PDF page as background image
      fabric.Image.fromURL(imgDataUrl, function (img) {
        canvas.setBackgroundImage(img, () => {
          // If we have saved annotations, load them
          if (pageAnnotations[pageNumber]) {
            canvas.loadFromJSON(pageAnnotations[pageNumber], canvas.renderAll.bind(canvas));
          } else {
            canvas.renderAll();
          }
        });
      }, { crossOrigin: 'Anonymous' });
    });
  });
}


// Zoom controls
function zoomIn(canvas) {
  zoomLevel += 0.1;
  renderPage(currentPage, canvas);
}

function zoomOut(canvas) {
  if (zoomLevel > 0.2) {
    zoomLevel -= 0.1;
    renderPage(currentPage, canvas);
  }
}

// Page navigation
function nextPage(canvas, updatePageDisplay) {
  if (currentPage < totalPages) {
    savePageAnnotations(canvas);
    currentPage++;
    renderPage(currentPage, canvas);
    updatePageDisplay(totalPages, currentPage);
  }
}

function previousPage(canvas, updatePageDisplay) {
  if (currentPage > 1) {
    savePageAnnotations(canvas);
    currentPage--;
    renderPage(currentPage, canvas);
    updatePageDisplay(totalPages, currentPage);
  }
}

// Save annotations for the current page
function savePageAnnotations(canvas) {
  pageAnnotations[currentPage] = JSON.stringify(canvas);
}

// Page number UI
function updatePageDisplay(total, current) {
  const el = document.getElementById('page-display');
  if (el) {
    el.innerText = `Page ${current} of ${total}`;
  }
}

window.PDFState = {
  get pdfDoc() { return pdfDoc },
  get totalPages() { return totalPages },
  get currentPage() { return currentPage },
  get zoomLevel() { return zoomLevel },
  get originalPdfBytes() { return originalPdfBytes },
  get pageAnnotations() { return pageAnnotations },
  get isPDF() { return isPDF },
  set currentPage(val) { currentPage = val },
  set isPDF(val) { isPDF = val }
};
