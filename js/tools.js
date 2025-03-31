// tools.js

//////////////////////
// Text Tool
//////////////////////

let textToolEnabled = false;

function addText() {
  deactivateAllTools(); // clear existing tools
  textToolEnabled = true;
  canvas.defaultCursor = 'text';

  const textOptions = document.getElementById('text-options');
  textOptions.style.display = 'flex';

  canvas.on('mouse:down', handleTextClick);
}

function handleTextClick(event) {
  if (!textToolEnabled) return;

  const pointer = canvas.getPointer(event.e);
  const fontSize = parseInt(document.getElementById('font-size').value, 10);
  const fontFamily = document.getElementById('font-family').value;
  const color = document.getElementById('font-color').value;

  const text = new fabric.IText('', {
    left: pointer.x,
    top: pointer.y,
    fontSize,
    fontFamily,
    fill: color,
    width: 300,
    padding: 4,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
    selectable: true,
    editable: true
  });

  disableResizing(text);
  applyFontSettings(text);
  canvas.add(text);
  canvas.setActiveObject(text);

  setTimeout(() => {
    text.enterEditing();
    text.selectAll();
  }, 0);

  // Save once user finishes typing
  text.on('editing:exited', () => {
    saveCurrentPageAnnotations(canvas, currentPage);
  });
}

function deactivateTextTool() {
  textToolEnabled = false;
  canvas.off('mouse:down', handleTextClick);
}


function keepToolActive() {
  return document.getElementById('multi-use-toggle')?.checked;
}


function applyFontSettings(textObject) {
  const updateFont = () => {
    if (canvas.getActiveObject() === textObject) {
      textObject.set({
        fontFamily: document.getElementById('font-family').value,
        fontSize: parseInt(document.getElementById('font-size').value, 10),
        fill: document.getElementById('font-color').value
      });
      canvas.renderAll();
    }
  };

  ['font-family', 'font-size', 'font-color'].forEach(id =>
    document.getElementById(id).addEventListener('change', updateFont)
  );
}

function disableResizing(obj) {
  obj.setControlsVisibility({
    mt: false, mb: false, ml: false, mr: false, bl: false, br: false, tl: false, tr: false, mtr: true
  });
}

//////////////////////
// Free Draw & Highlighter
//////////////////////

function addFreeDraw() {
  deactivateAllTools();

  canvas.isDrawingMode = true;

  // Make sure we are using a proper PencilBrush
  if (!(canvas.freeDrawingBrush instanceof fabric.PencilBrush)) {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  }

  // Update brush based on current UI controls
  const width = parseInt(document.getElementById('line-width').value, 10) || 2;
  const color = document.getElementById('line-color').value || '#000000';

  canvas.freeDrawingBrush.width = width;
  canvas.freeDrawingBrush.color = color;

  canvas.renderAll();
  showToolbar();

  console.log('🖋️ Freehand drawing mode activated');
}

function addHighlighter() {
  deactivateAllTools();
  canvas.isDrawingMode = true;

  const highlighterColor = document.getElementById('highlighter-color')?.value || 'rgba(255, 255, 0, 0.4)';
  canvas.freeDrawingBrush.width = 15;
  canvas.freeDrawingBrush.color = highlighterColor;

  showToolbar();
  console.log('🖍️ Highlighter mode activated with color:', highlighterColor);
}

function updateBrushSettings() {
  canvas.freeDrawingBrush.width = parseInt(document.getElementById('line-width').value, 10);
  canvas.freeDrawingBrush.color = document.getElementById('line-color').value;
}

//////////////////////
// Shape Tools (DRY)
//////////////////////

function addShape(shapeType) {
  deactivateAllTools();
  let isDrawing = false;
  let shape;

  canvas.on('mouse:down', function (o) {
    isDrawing = true;
    const pointer = canvas.getPointer(o.e);
    const strokeWidth = parseInt(document.getElementById('line-width').value, 10);
    const strokeColor = document.getElementById('line-color').value;

    const baseOptions = {
      left: pointer.x,
      top: pointer.y,
      strokeWidth,
      stroke: strokeColor,
      fill: null,
      selectable: true,
      evented: false
    };

    switch (shapeType) {
      case 'line':
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          ...baseOptions
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...baseOptions,
          radius: 0
        });
        break;
      case 'rect':
        shape = new fabric.Rect({
          ...baseOptions,
          width: 0,
          height: 0
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          ...baseOptions,
          width: 0,
          height: 0
        });
        break;
    }

    canvas.add(shape);
  });

  canvas.on('mouse:move', function (o) {
    if (!isDrawing) return;
    const pointer = canvas.getPointer(o.e);
    if (shapeType === 'line') {
      shape.set({ x2: pointer.x, y2: pointer.y });
    } else if (shapeType === 'circle') {
      const radius = Math.sqrt(Math.pow(pointer.x - shape.left, 2) + Math.pow(pointer.y - shape.top, 2));
      shape.set({ radius });
    } else {
      shape.set({
        width: pointer.x - shape.left,
        height: pointer.y - shape.top
      });
    }
    canvas.renderAll();
  });

  canvas.on('mouse:up', function () {
    isDrawing = false;
    shape.set({ evented: true });
    canvas.setActiveObject(shape);
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    saveCurrentPageAnnotations(canvas, currentPage);
  });
}

// Individual shape functions
const addLine = () => addShape('line');
const addCircle = () => addShape('circle');
const addRectangle = () => addShape('rect');
const addTriangle = () => addShape('triangle');

//////////////////////
// Tool State Mgmt
//////////////////////

function deactivateAllTools() {
  canvas.isDrawingMode = false;
  canvas.selection = true;
  canvas.discardActiveObject();
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');
  deactivateTextTool(); // <- clean up text
  hideToolbar();
  deactivateDateTool();
}

function selectPointer() {
  deactivateAllTools();
  canvas.selection = true;
  canvas.isDrawingMode = false;
  canvas.defaultCursor = 'default';
}

function showToolbar() {
  document.getElementById('free-draw-toolbar').style.display = 'flex';
}

function hideToolbar() {
  document.getElementById('free-draw-toolbar').style.display = 'flex'; // keep visible
  document.getElementById('text-options').style.display = 'flex';     // keep visible
}

const floatingTextarea = document.getElementById('floating-textarea');

// Listen for double-click to open textarea
canvas.on('mouse:dblclick', (event) => {
  if (!textToolEnabled) return;

  // Stop the mouse:down from also firing
  event.e.preventDefault();
  event.e.stopPropagation();

  const pointer = canvas.getPointer(event.e);
  const canvasEl = canvas.upperCanvasEl.getBoundingClientRect();

  const canvasX = canvasEl.left + pointer.x;
  const canvasY = canvasEl.top + pointer.y;

  // Style and show the textarea
  floatingTextarea.style.left = `${canvasX}px`;
  floatingTextarea.style.top = `${canvasY}px`;
  floatingTextarea.style.display = 'block';
  floatingTextarea.classList.remove('hidden');
  floatingTextarea.value = '';
  floatingTextarea.focus();

  // Save for later
  floatingTextarea.dataset.x = pointer.x;
  floatingTextarea.dataset.y = pointer.y;
});

// Handle blur or Enter press
function finalizeFloatingText() {
  const text = floatingTextarea.value.trim();
  if (text) {
    const x = parseFloat(floatingTextarea.dataset.x);
    const y = parseFloat(floatingTextarea.dataset.y);

    const fontSize = parseInt(document.getElementById('font-size').value, 10);
    const fontFamily = document.getElementById('font-family').value;
    const color = document.getElementById('font-color').value;

    const textObj = new fabric.Text(text, {
      left: x,
      top: y,
      fontSize,
      fontFamily,
      fill: color,
      selectable: true,
      padding: 4,
    });

    disableResizing(textObj);
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    saveCurrentPageAnnotations(canvas, currentPage);
  }

  // Cleanup
  floatingTextarea.style.display = 'none';
  floatingTextarea.classList.add('hidden');
  floatingTextarea.value = '';
}

// Trigger finalize on blur or Enter
floatingTextarea.addEventListener('blur', finalizeFloatingText);
floatingTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    floatingTextarea.blur(); // will trigger finalize
  }
});
