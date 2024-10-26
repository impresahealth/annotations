// pdf-utils.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
let pdfDoc = null;
let totalPages = 0;
let currentPage = 1;
let zoomLevel = 1.0;  // Default zoom level
let pageAnnotations = {};  // Store annotations for each page

function renderPDF(file, canvas, updatePageDisplay) {
  const reader = new FileReader();
  reader.onload = function(event) {
      const typedArray = new Uint8Array(event.target.result);
      pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
          pdfDoc = pdf;
          totalPages = pdf.numPages;
          currentPage = 1;
          console.log("PDF loaded. Total pages:", totalPages);
          renderPage(currentPage, canvas);  // Render the first page
          updatePageDisplay(totalPages, currentPage);  // Update page display (for UI)
      }).catch(function(error) {
          console.error("Error loading PDF:", error);
      });
  };
  reader.readAsArrayBuffer(file);
}

function renderPage(pageNumber, canvas) {
  pdfDoc.getPage(pageNumber).then(function(page) {
    const viewport = page.getViewport({ scale: zoomLevel });

    // Adjust canvas size based on the viewport (PDF page size)
    canvas.setWidth(viewport.width);
    canvas.setHeight(viewport.height);

    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;

    // Render PDF page onto the temporary canvas
    page.render({
      canvasContext: tempContext,
      viewport: viewport
    }).promise.then(() => {
      // Set the PDF page as the background image for the Fabric.js canvas
      canvas.setBackgroundImage(tempCanvas.toDataURL(), canvas.renderAll.bind(canvas));

      // Load saved annotations for this page or clear if none exist
      if (pageAnnotations[pageNumber]) {
        canvas.loadFromJSON(pageAnnotations[pageNumber], canvas.renderAll.bind(canvas));
      } else {
        canvas.clear();  // Clear annotations for a new page
      }
    });
  });
}

// Save annotations for the current page before navigating away
function savePageAnnotations(canvas) {
    pageAnnotations[currentPage] = JSON.stringify(canvas);
}

function nextPage(canvas, updatePageDisplay) {
  if (currentPage < totalPages) {
      console.log(`Navigating to next page: ${currentPage + 1}`);
      savePageAnnotations(canvas);  
      currentPage++;
      renderPage(currentPage, canvas);  
      updatePageDisplay(totalPages, currentPage);  
  }
}

function previousPage(canvas, updatePageDisplay) {
  if (currentPage > 1) {
    savePageAnnotations(canvas);  // Save current annotations
    currentPage--;
    renderPage(currentPage, canvas);  // Render the previous page
    updatePageDisplay(totalPages, currentPage);  // Update display
  }
}

function zoomIn(canvas) {
  zoomLevel += 0.1;  // Increase zoom level
  renderPage(currentPage, canvas);  // Re-render the current page with the new zoom level
}

function zoomOut(canvas) {
  if (zoomLevel > 0.2) {
    zoomLevel -= 0.1;  // Decrease zoom level
    renderPage(currentPage, canvas);  // Re-render the current page with the new zoom level
  }
}

function updatePageDisplay(totalPages, currentPage) {
  document.getElementById('page-display').innerText = `Page ${currentPage} of ${totalPages}`;
}
