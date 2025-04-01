// listeners.js

document.addEventListener('DOMContentLoaded', () => {
  const fileUpload = document.getElementById('file-upload');
  const downloadButton = document.getElementById('downloadButton');

  /////////////////////////////////
  // 📁 File Upload Handler
  /////////////////////////////////
  fileUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resetCanvas(canvas);
    if (file.type === 'application/pdf') {
      renderPDF(file, canvas, updatePageDisplay);
    } else if (file.type.startsWith('image/')) {
      renderImage(file, canvas);
    } else {
      alert('Unsupported file type. Please upload a PDF or image.');
    }
  });

  /////////////////////////////////
  // 🛠️ Annotation Tool Bindings
  /////////////////////////////////
  const toolBindings = [
    ['pointerButton', selectPointer],
    ['addTextButton', addText],
    ['signatureButton', openSignatureModal],
    ['dateButton', addDate],
    ['freeDrawButton', addFreeDraw],
    ['highlighterButton', addHighlighter],
    ['addLineButton', addLine],
    ['addCircleButton', addCircle],
    ['addRectangleButton', addRectangle],
    ['addTriangleButton', addTriangle],
    ['undoButton', undoLastAnnotation],
    ['clearButton', clearAllAnnotations],
  ];

  toolBindings.forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('click', fn);
  });

  /////////////////////////////////
  // ⬇️ Export Handler
  /////////////////////////////////
  downloadButton?.addEventListener('click', () => {
    saveCurrentPageAnnotations(canvas, PDFState.currentPage);
    const exportTypeSelect = document.getElementById('export-type');
    const fileType = exportTypeSelect?.value || (PDFState.originalPdfBytes ? 'PDF' : 'PNG');
    download(canvas, fileType);
      });

  /////////////////////////////////
  // 🔁 Page Navigation
  /////////////////////////////////
  document.getElementById('next-page')?.addEventListener('click', () => {
    if (PDFState.currentPage < PDFState.totalPages) {
      saveCurrentPageAnnotations(canvas, PDFState.currentPage);
      PDFState.currentPage++;
      renderPage(PDFState.currentPage, canvas);
      updatePageDisplay(PDFState.totalPages, PDFState.currentPage);
    }
  });

  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (PDFState.currentPage > 1) {
      saveCurrentPageAnnotations(canvas, PDFState.currentPage);
      PDFState.currentPage--;
      renderPage(PDFState.currentPage, canvas);
      updatePageDisplay(PDFState.totalPages, PDFState.currentPage);
    }
  });

  /////////////////////////////////
  // 🔍 Zoom Controls
  /////////////////////////////////
  document.getElementById('zoom-in')?.addEventListener('click', () => zoomIn(canvas));
  document.getElementById('zoom-out')?.addEventListener('click', () => zoomOut(canvas));

  /////////////////////////////////
  // 🎯 Active Object Reflects UI
  /////////////////////////////////
  canvas.on('object:selected', () => {
    const active = canvas.getActiveObject();
    if (!active) return;

    if (active.type === 'i-text') {
      document.getElementById('font-family').value = active.fontFamily || 'Arial';
      document.getElementById('font-size').value = active.fontSize || 20;
      document.getElementById('font-color').value = active.fill || '#000000';
    }

    if (active.stroke) {
      document.getElementById('line-width').value = active.strokeWidth || 2;
      document.getElementById('line-color').value = active.stroke || '#000000';
    }
  });

  /////////////////////////////////
  // 🎯 Optional: Deselect Cleanup
  /////////////////////////////////
  canvas.on('selection:cleared', () => {
    // Optionally reset controls if no object is selected
  });
});

document.getElementById('highlighter-color').addEventListener('change', () => {
  if (canvas.isDrawingMode) {
    canvas.freeDrawingBrush.color = document.getElementById('highlighter-color').value;
  }
});

canvas.on('mouse:dblclick', (event) => {
  if (!textToolEnabled) return;

  handleTextClick(event); // reuse the existing logic
});
