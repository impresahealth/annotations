document.addEventListener('DOMContentLoaded', function() {
    // File upload handling (PDF or images)
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
      fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const fileType = file.type;
          if (fileType === 'application/pdf') {
            renderPDF(file, canvas, updatePageDisplay);  // PDF rendering
          } else if (fileType.startsWith('image/')) {
            renderImage(file, canvas);  // Image rendering
          } else {
            console.error('Unsupported file type. Please upload a PDF, PNG, or JPG.');
          }
        }
      });
    }
  
    // Event listeners for annotation tools
    document.getElementById('addTextButton').addEventListener('click', addText);
    document.getElementById('addLineButton').addEventListener('click', addLine);
    document.getElementById('addCircleButton').addEventListener('click', addCircle);
    document.getElementById('addRectangleButton').addEventListener('click', addRectangle);
    document.getElementById('addTriangleButton').addEventListener('click', addTriangle);
    document.getElementById('pointerButton').addEventListener('click', selectPointer);
    document.getElementById('signatureButton').addEventListener('click', openSignatureModal);
    document.getElementById('dateButton').addEventListener('click', addDate);
    document.getElementById('freeDrawButton').addEventListener('click', addFreeDraw);
    document.getElementById('highlighterButton').addEventListener('click', addHighlighter);
    document.getElementById('undoButton').addEventListener('click', undoLastAnnotation);
    document.getElementById('clearButton').addEventListener('click', clearAllAnnotations);
    //document.getElementById('downloadButton').addEventListener('click', download);
    document.getElementById('downloadButton').addEventListener('click', downloadPDFWithAnnotations);

    function saveCurrentPageAnnotations(canvas, currentPage) {
      if (canvas) {
        // Serialize the canvas as JSON and save it to the pageAnnotations object
        pageAnnotations[currentPage] = JSON.stringify(canvas);
        console.log(`Annotations saved for page ${currentPage}.`);
      } else {
        console.warn(`Canvas not found while trying to save annotations for page ${currentPage}.`);
      }
    }


// Example for page navigation (prev/next page buttons)
document.getElementById('next-page').addEventListener('click', function() {
  saveCurrentPageAnnotations(canvas, currentPage);  // Save annotations before navigating
  if (currentPage < totalPages) {
    currentPage++;
    renderPage(currentPage, canvas);  // Render the next page
    updatePageDisplay(totalPages, currentPage);
  }
});

document.getElementById('prev-page').addEventListener('click', function() {
  saveCurrentPageAnnotations(canvas, currentPage);  // Save annotations before navigating
  if (currentPage > 1) {
    currentPage--;
    renderPage(currentPage, canvas);  // Render the previous page
    updatePageDisplay(totalPages, currentPage);
  }
});



    document.getElementById('zoom-in').addEventListener('click', function() {
      zoomIn(canvas);
    });
    document.getElementById('zoom-out').addEventListener('click', function() {
      zoomOut(canvas);
    });
  
    // Canvas object selection handler (to update font/line properties dynamically)
    canvas.on('object:selected', function() {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'i-text') {
          document.getElementById('font-family').value = activeObject.fontFamily;
          document.getElementById('font-size').value = activeObject.fontSize;
          document.getElementById('font-color').value = activeObject.fill;
        }
        if (activeObject.stroke) {
          document.getElementById('line-width').value = activeObject.strokeWidth;
          document.getElementById('line-color').value = activeObject.stroke;
        }
      }
    });
  });
  