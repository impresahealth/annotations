let undoStack = [];  // Stack to keep track of objects for undo

// Ensure that all objects added are pushed to the undo stack
canvas.on('object:added', function(event) {
  const obj = event.target;
  if (obj && obj !== canvas.backgroundImage) {
    undoStack.push(obj);  // Add the object to the undo stack
    console.log("Object added to undo stack:", obj);
  }
});

// Undo the last annotation
function undoLastAnnotation() {
  if (undoStack.length > 0) {
    const lastObject = undoStack.pop();  // Get the last object from the stack
    canvas.remove(lastObject);  // Remove the last object from the canvas
    canvas.renderAll();  // Re-render the canvas
    console.log("Undo successful. Object removed:", lastObject);
  } else {
    console.log("No more objects to undo.");
  }
}


function clearAllAnnotations() {
  console.log("Clear All button clicked!");  // Add this line for debugging

  const background = canvas.backgroundImage;
  
  // Clear the entire canvas
  canvas.clear();
  
  // Restore the background image if it exists
  if (background) {
    canvas.setBackgroundImage(background, canvas.renderAll.bind(canvas));
  }

  // Clear the undo stack
  undoStack = [];
  
  console.log("Cleared all annotations, background preserved.");
}

function downloadPDFWithAnnotations() {
  // Get the actual dimensions of the canvas
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // Determine orientation based on canvas dimensions
  const orientation = canvasWidth > canvasHeight ? 'landscape' : 'portrait';

  // Initialize jsPDF with custom dimensions and orientation
  const pdf = new window.jspdf.jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [canvasWidth, canvasHeight] // Use the canvas dimensions
  });

  // Save annotations for the current page before starting download
  saveCurrentPageAnnotations(canvas, currentPage);

  const processPage = (pageNumber, callback) => {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');

    pdfDoc.getPage(pageNumber).then(page => {
      const viewport = page.getViewport({ scale: 1.0 });
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      console.log(`Rendering PDF page ${pageNumber} with exact dimensions: ${viewport.width}x${viewport.height}`);

      // Render the PDF page onto the temporary canvas
      page.render({
        canvasContext: tempContext,
        viewport: viewport
      }).promise.then(() => {
        console.log(`PDF page ${pageNumber} rendered on tempCanvas.`);

        // Create a Fabric canvas with exact dimensions for adding annotations
        const tempFabricCanvas = new fabric.Canvas(tempCanvas);
        
        // Ensure no scaling transformations affect the export
        tempFabricCanvas.setDimensions({ width: viewport.width, height: viewport.height });
        tempFabricCanvas.setZoom(1);

        if (pageAnnotations[pageNumber]) {
          console.log(`Loading annotations for page ${pageNumber}.`);

          // Load annotations onto the Fabric canvas
          tempFabricCanvas.loadFromJSON(pageAnnotations[pageNumber], () => {
            tempFabricCanvas.renderAll();
            console.log(`Annotations loaded for page ${pageNumber}.`);

            // Capture the annotated canvas as an image and add it to the PDF
            const dataURL = tempFabricCanvas.toDataURL('image/png');
            if (pageNumber > 1) pdf.addPage();
            pdf.addImage(dataURL, 'PNG', 0, 0, canvasWidth, canvasHeight);  // Use exact canvas dimensions here
            callback();
          });
        } else {
          // If no annotations, just add the rendered PDF page background
          const pageDataURL = tempCanvas.toDataURL('image/png');
          if (pageNumber > 1) pdf.addPage();
          pdf.addImage(pageDataURL, 'PNG', 0, 0, canvasWidth, canvasHeight);  // Use exact canvas dimensions here
          console.log(`Page ${pageNumber} added to PDF without annotations.`);
          callback();
        }
      }).catch(error => {
        console.error(`Error rendering page ${pageNumber}:`, error);
      });
    }).catch(error => {
      console.error(`Error loading page ${pageNumber}:`, error);
    });
  };

  // Sequentially render pages
  const renderSequentially = (currentPage) => {
    if (currentPage > totalPages) {
      console.log("Saving PDF...");
      pdf.save('annotated-version.pdf');
    } else {
      processPage(currentPage, () => renderSequentially(currentPage + 1));
    }
  };

  renderSequentially(1);
}


function saveCurrentPageAnnotations(canvas, currentPage) {
  if (canvas) {
    // Serialize the canvas as JSON and save it to the pageAnnotations object
    pageAnnotations[currentPage] = JSON.stringify(canvas);
    console.log(`Annotations saved for page ${currentPage}.`);
  } else {
    console.warn(`Canvas not found while trying to save annotations for page ${currentPage}.`);
  }
}



// Line width and color change events
document.getElementById('line-width').addEventListener('change', function() {
  const selectedWidth = parseInt(this.value, 10);
  canvas.freeDrawingBrush.width = selectedWidth;
  if (canvas.getActiveObject() && canvas.getActiveObject().strokeWidth) {
    canvas.getActiveObject().set('strokeWidth', selectedWidth);
    canvas.renderAll();
  }
});

document.getElementById('line-color').addEventListener('change', function() {
  const selectedColor = this.value;
  canvas.freeDrawingBrush.color = selectedColor;
  if (canvas.getActiveObject() && canvas.getActiveObject().stroke) {
    canvas.getActiveObject().set('stroke', selectedColor);
    canvas.renderAll();
  }
});


// Modal and signature canvas elements
const signatureModal = document.getElementById('signature-modal');
const signatureCanvas = document.getElementById('signature-canvas');
const signatureCtx = signatureCanvas.getContext('2d');

// Flag to check if the user is drawing
let isSigning = false;

// Open the signature modal
function openSignatureModal() {
  signatureModal.classList.remove('hidden');
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);  // Clear previous signatures
}

// Close the signature modal
function closeSignatureModal() {
  signatureModal.classList.add('hidden');
}

// Handle signature drawing on the canvas
signatureCanvas.addEventListener('mousedown', (e) => {
  isSigning = true;
  signatureCtx.beginPath();
  signatureCtx.moveTo(e.offsetX, e.offsetY);
});

signatureCanvas.addEventListener('mousemove', (e) => {
  if (isSigning) {
    signatureCtx.lineTo(e.offsetX, e.offsetY);
    signatureCtx.strokeStyle = document.getElementById('signature-color').value;
    signatureCtx.lineWidth = 2;
    signatureCtx.stroke();
  }
});

signatureCanvas.addEventListener('mouseup', () => {
  isSigning = false;
});

signatureCanvas.addEventListener('mouseleave', () => {
  isSigning = false;
});

// Clear the signature canvas
function clearSignature() {
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

// Save the signature and place it on the main canvas
function saveSignature() {
  const signatureDataURL = signatureCanvas.toDataURL('image/png');  // Save signature as PNG
  fabric.Image.fromURL(signatureDataURL, function(img) {
    img.scale(0.5);  // Scale down if needed
    canvas.add(img);  // Add the signature image to the main canvas
    canvas.renderAll();
  });
  closeSignatureModal();  // Close the modal after saving
}

function addDate() {
  // Get today's date in MM/DD/YYYY format
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  // Create a new text object with the formatted date
  const dateText = new fabric.Text(formattedDate, {
    left: 50,  // Position where the date will appear (you can adjust)
    top: 50,
    fontSize: 24,  // Adjust the font size
    fill: 'black',  // Default color (you can customize or add options)
    fontFamily: 'Arial',
    selectable: true,  // Allow users to move/resize the date
  });

  // Add the date text to the canvas
  canvas.add(dateText);
  canvas.setActiveObject(dateText);  // Set it as the active object for easy editing/moving
  canvas.renderAll();  // Re-render the canvas

  console.log("Today's date added:", formattedDate);
}
