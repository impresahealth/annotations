// canvas-utils.js

let undoStack = [];

function resetCanvas(canvas) {
  if (!canvas) return;

  console.log("🔁 Performing full canvas reset...");
  canvas.clear();
  canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
  canvas.setWidth(800);
  canvas.setHeight(600);

  undoStack = [];

  if (typeof PDFState !== 'undefined') {
    PDFState.pageAnnotations = {};
    PDFState.currentPage = 1;
    PDFState.zoomLevel = 1.0;
  }

  // 🧨 Also nuke global annotation cache
  if (typeof pageAnnotations !== 'undefined') {
    pageAnnotations = {}; // <--- important!
  }

  deactivateAllTools();
}

// Push new objects to the undo stack
canvas.on('object:added', (event) => {
  const obj = event.target;
  if (obj && obj !== canvas.backgroundImage) {
    undoStack.push(obj);
    console.log("Added to undo stack:", obj);
    if (typeof PDFState !== 'undefined') {
      saveCurrentPageAnnotations(canvas, PDFState.currentPage);
    }
  }
});

// Undo the last object
function undoLastAnnotation() {
  const last = undoStack.pop();
  if (last) {
    canvas.remove(last);
    canvas.renderAll();
    console.log("Undo:", last);
  } else {
    console.log("Undo stack is empty.");
  }
}

// Clear annotations but keep background
function clearAllAnnotations() {
  console.log("Clear All clicked!");
  const bg = canvas.backgroundImage;
  canvas.clear();
  if (bg) canvas.setBackgroundImage(bg, canvas.renderAll.bind(canvas));
  undoStack = [];
}

// Download handler
function download(canvas, fileType) {
  if (fileType === 'PNG') {
    downloadAsPNG(canvas);
  } else if (fileType === 'PDF') {
    if (PDFState.originalPdfBytes) {
      exportPDFAsVector(); // working on actual PDF
    } else {
      exportImageAsPDF(canvas); // 📸 support image-based canvas
    }
  }
  }

// PNG export
function downloadAsPNG(canvas) {
  const dataURL = canvas.toDataURL({ format: 'png', quality: 1.0 });
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'annotated-image.png';
  link.click();
}

// Save annotations for a given page
function saveCurrentPageAnnotations(canvas, currentPage) {
  if (!canvas) return;
  pageAnnotations[currentPage] = JSON.stringify(canvas);
  console.log(`Saved annotations for page ${currentPage}`);
}

//////////////////////////////
// Signature Modal Handling //
//////////////////////////////

const signatureModal = document.getElementById('signature-modal');
const signatureCanvas = document.getElementById('signature-canvas');
const signatureCtx = signatureCanvas.getContext('2d');
let isSigning = false;

function openSignatureModal() {
  signatureModal.classList.remove('hidden');
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

function closeSignatureModal() {
  signatureModal.classList.add('hidden');
}

function clearSignature() {
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

function saveSignature() {
  const signatureDataURL = signatureCanvas.toDataURL('image/png');
  fabric.Image.fromURL(signatureDataURL, (img) => {
    img.scale(0.5);
    canvas.add(img);
    canvas.renderAll();
  });
  closeSignatureModal();
}

// Signature drawing
signatureCanvas.addEventListener('mousedown', (e) => {
  isSigning = true;
  signatureCtx.beginPath();
  signatureCtx.moveTo(e.offsetX, e.offsetY);
});

signatureCanvas.addEventListener('mousemove', (e) => {
  if (!isSigning) return;
  signatureCtx.lineTo(e.offsetX, e.offsetY);
  signatureCtx.strokeStyle = document.getElementById('signature-color').value;
  signatureCtx.lineWidth = 2;
  signatureCtx.stroke();
});

signatureCanvas.addEventListener('mouseup', () => isSigning = false);
signatureCanvas.addEventListener('mouseleave', () => isSigning = false);

////////////////////
// Add Date Tool //
////////////////////

let dateToolEnabled = false;

function addDate() {
  deactivateAllTools();
  dateToolEnabled = true;
  canvas.defaultCursor = 'crosshair';

  canvas.on('mouse:down', handleDatePlacement);
}

function handleDatePlacement(event) {
  if (!dateToolEnabled) return;

  const pointer = canvas.getPointer(event.e);
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  const dateText = new fabric.IText(formattedDate, {
    left: pointer.x,
    top: pointer.y,
    fontSize: 24,
    fill: 'black',
    fontFamily: 'Arial',
    selectable: true,
    editable: true,
    padding: 4,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true
  });

  canvas.add(dateText);
  canvas.setActiveObject(dateText);

  setTimeout(() => {
    canvas.setActiveObject(dateText);
    dateText.enterEditing();
    dateText.selectAll();
  }, 50); // ← give the browser time to finish render stack
  
  saveCurrentPageAnnotations(canvas, currentPage);

  deactivateDateTool();
  selectPointer();
}

function deactivateDateTool() {
  dateToolEnabled = false;
  canvas.off('mouse:down', handleDatePlacement);
}


function handleDatePlaement(event) {
  if (!dateToolEnabled) return;

  const pointer = canvas.getPointer(event.e);
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  const dateText = new fabric.Text(formattedDate, {
    left: pointer.x,
    top: pointer.y,
    fontSize: 24,
    fill: 'black',
    fontFamily: 'Arial',
    selectable: true,
  });

  canvas.add(dateText);
  canvas.setActiveObject(dateText);
  canvas.renderAll();

  console.log("🗓️ Placed date at:", pointer);

  // Disable date tool after placing
  deactivateDateTool();
  selectPointer(); // optional: return to pointer
}

function deactivateDateTool() {
  dateToolEnabled = false;
  canvas.off('mouse:down', handleDatePlacement);
}

//////////////////////////
// Brush/Stroke Controls //
//////////////////////////

document.getElementById('line-width').addEventListener('change', function () {
  const width = parseInt(this.value, 10);
  canvas.freeDrawingBrush.width = width;
  const obj = canvas.getActiveObject();
  if (obj && obj.strokeWidth) {
    obj.set('strokeWidth', width);
    canvas.renderAll();
  }
});

document.getElementById('line-color').addEventListener('change', function () {
  const color = this.value;
  canvas.freeDrawingBrush.color = color;
  const obj = canvas.getActiveObject();
  if (obj && obj.stroke) {
    obj.set('stroke', color);
    canvas.renderAll();
  }
});

function fabricColorToRGBArray(fabricColor) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = fabricColor || '#000000'; // Fallback to black if empty
  const rgbMatch = ctx.fillStyle.match(/\d+/g);
  const rgb = rgbMatch ? rgbMatch.map(Number) : [0, 0, 0]; // Defensive
  return rgb.map(c => c / 255); // Normalize
}

function getSafeColor(colorValue) {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = colorValue || '#000000';
    const computedColor = ctx.fillStyle;

    // Match "rgb(r, g, b)" format
    let match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      const r = parseInt(match[1], 10) / 255;
      const g = parseInt(match[2], 10) / 255;
      const b = parseInt(match[3], 10) / 255;
      return PDFLib.rgb(r, g, b);
    }

    // Match hex color format "#rrggbb"
    match = computedColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (match) {
      const r = parseInt(match[1], 16) / 255;
      const g = parseInt(match[2], 16) / 255;
      const b = parseInt(match[3], 16) / 255;
      return PDFLib.rgb(r, g, b);
    }

    // Match short hex "#rgb" (e.g. "#f00")
    match = computedColor.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (match) {
      const r = parseInt(match[1] + match[1], 16) / 255;
      const g = parseInt(match[2] + match[2], 16) / 255;
      const b = parseInt(match[3] + match[3], 16) / 255;
      return PDFLib.rgb(r, g, b);
    }

    // Unknown format, fallback
    return PDFLib.rgb(0, 0, 0);
  } catch (err) {
    console.warn('Failed to convert color:', colorValue, err);
    return PDFLib.rgb(0, 0, 0); // Fallback
  }
}

// ✨ UPDATED exportPDFAsVector()
async function exportPDFAsVector() {
  const { originalPdfBytes, pageAnnotations, totalPages, viewportSize } = PDFState;

  if (!originalPdfBytes) {
    console.error("No PDF loaded. Cannot export.");
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  for (let i = 1; i <= totalPages; i++) {
    const page = pages[i - 1];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const scaleX = 1;
    const scaleY = 1;

    const tempCanvas = document.createElement('canvas');
    const fabricCanvas = new fabric.StaticCanvas(tempCanvas, {
      width: pageWidth,
      height: pageHeight
    });

    fabricCanvas.setZoom(1);
    fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];

    if (pageAnnotations[i]) {
      await new Promise(resolve => {
        fabricCanvas.loadFromJSON(pageAnnotations[i], async () => {
          fabricCanvas.renderAll();

          for (const obj of fabricCanvas.getObjects()) {
            const hasFill = obj.fill && obj.fill !== 'transparent' && obj.fill !== 'rgba(0,0,0,0)';
            const fillColor = hasFill ? getSafeColor(obj.fill) : undefined;

            const hasStroke = obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'rgba(0,0,0,0)';
            const strokeColor = hasStroke ? getSafeColor(obj.stroke) : undefined;

            const strokeWidth = obj.strokeWidth || 1;

            const left = obj.left || 0;
            const top = obj.top || 0;

if (obj.type === 'path') {
  // Detect if this is a highlighter
  const isHighlighter = obj.stroke?.includes('rgba(255, 255, 0');

  // Adjust settings for highlighter paths
  const padding = isHighlighter ? 20 : 10;
  const multiplier = isHighlighter ? 3 : 2;

  // Create temp canvas
  const temp = new fabric.StaticCanvas(null, {
    width: obj.width + padding * 2,
    height: obj.height + padding * 2
  });

  const cloned = fabric.util.object.clone(obj);
  cloned.left = padding;
  cloned.top = padding;

  temp.add(cloned);
  temp.renderAll();

  const dataUrl = temp.toDataURL({
    format: 'png',
    multiplier: multiplier
  });

  const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
  const img = await pdfDoc.embedPng(imgBytes);

  const pdfX = (obj.left || 0) - padding;
  const pdfY = pageHeight - (obj.top || 0) - obj.height - padding;

  page.drawImage(img, {
    x: pdfX,
    y: pdfY,
    width: obj.width + padding * 2,
    height: obj.height + padding * 2
  });
}
                                    
            else if (obj.type === 'i-text' || obj.type === 'text') {
              const fontSize = obj.fontSize || 16;
              page.drawText(obj.text || '', {
                x: left,
                y: pageHeight - top - fontSize,
                size: fontSize,
                color: fillColor || getSafeColor('#000000'),
                font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
              });
            }

            else if (obj.type === 'rect') {
              page.drawRectangle({
                x: left,
                y: pageHeight - top - obj.height,
                width: obj.width,
                height: obj.height,
                color: fillColor,
                borderColor: strokeColor,
                borderWidth: strokeWidth
              });
            }

            else if (obj.type === 'line') {
              const start = fabric.util.transformPoint({ x: obj.x1, y: obj.y1 }, obj.calcTransformMatrix());
              const end = fabric.util.transformPoint({ x: obj.x2, y: obj.y2 }, obj.calcTransformMatrix());

              page.drawLine({
                start: {
                  x: start.x,
                  y: pageHeight - start.y
                },
                end: {
                  x: end.x,
                  y: pageHeight - end.y
                },
                thickness: strokeWidth,
                color: strokeColor || getSafeColor('#000000')
              });
            }

            else if (obj.type === 'circle') {
              const radius = obj.radius;
              page.drawEllipse({
                x: left + radius,
                y: pageHeight - top - radius,
                xScale: radius,
                yScale: radius,
                borderWidth: strokeWidth,
                color: fillColor,
                borderColor: strokeColor,
              });
            }

            else if (obj.type === 'triangle') {
              page.drawSvgPath(getTriangleSvgPath(obj), {
                x: left,
                y: pageHeight - top - obj.height,
                scale: 1,
                color: fillColor,
                borderColor: strokeColor,
                borderWidth: strokeWidth,
              });
            }

            else if (obj.type === 'image') {
              const dataUrl = obj.toDataURL();
              const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
              const img = await pdfDoc.embedPng(imgBytes);

              page.drawImage(img, {
                x: left,
                y: pageHeight - top - obj.height,
                width: obj.width,
                height: obj.height
              });
            }
          }

          resolve();
        });
      });
    }
  }

  const annotatedBytes = await pdfDoc.save();
  const blob = new Blob([annotatedBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'annotated-vector.pdf';
  link.click();
}

async function exportImageAsPDF(canvas) {
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage();

  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 2
  });

  const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
  const img = await pdfDoc.embedPng(imgBytes);

  const { width, height } = img.scale(1);
  page.setSize(width, height);
  page.drawImage(img, {
    x: 0,
    y: 0,
    width,
    height
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'annotated-image.pdf';
  link.click();
}



function getTriangleSvgPath(obj) {
  // Fabric triangle defaults to 3 points: bottom-left, top-center, bottom-right
  const w = obj.width || 0;
  const h = obj.height || 0;
  return `M 0 ${h} L ${w / 2} 0 L ${w} ${h} Z`;
}
