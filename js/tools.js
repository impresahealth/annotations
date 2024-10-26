function addText() {
  const textOptions = document.getElementById('text-options');
  if (!textOptions) {
    console.error('textOptions element is not found');
    return;
  }

  if (!canvas) {
    console.error('Canvas is not initialized');
    return;
  }

  deactivateAllTools();
  textOptions.style.display = 'flex';
  
  console.log('addText function triggered');

  canvas.off('mouse:down');
  canvas.once('mouse:down', function(event) {
    console.log('Mouse down event triggered');
    const pointer = canvas.getPointer(event.e);
    const text = new fabric.IText('Type here', {
      left: pointer.x,
      top: pointer.y,
      fontSize: parseInt(document.getElementById('font-size').value, 10),
      fill: document.getElementById('font-color').value,
      fontFamily: document.getElementById('font-family').value,
      width: 200,
      lockScalingX: true,
      lockScalingY: true,
      lockUniScaling: true,
      selectable: true,
      editable: true
    });
    disableResizing(text);
    text.on('changed', () => autoResizeTextBox(text));
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    applyFontSettings(text);  // Ensure that font settings apply dynamically
    canvas.off('mouse:down');
  });
  saveCurrentPageAnnotations(canvas, currentPage);
}
  
  function autoResizeTextBox(text) {
    text.set({
      width: Math.max(text.width, 200),
      height: text.calcTextHeight() + 10
    });
    canvas.renderAll();
    saveCurrentPageAnnotations(canvas, currentPage);
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
    document.getElementById('font-family').addEventListener('change', updateFont);
    document.getElementById('font-size').addEventListener('change', updateFont);
    document.getElementById('font-color').addEventListener('change', updateFont);
    saveCurrentPageAnnotations(canvas, currentPage);
  }
  
  function disableResizing(text) {
    text.setControlsVisibility({
      mt: false, mb: false, ml: false, mr: false, bl: false, br: false, tl: false, tr: false, mtr: true
    });
  }
  
  // Free Draw tool
  function addFreeDraw() {
    deactivateAllTools();  // Disable any other tools that may be active
    canvas.isDrawingMode = true;  // Enable drawing mode on the canvas

    // Dynamically set brush width and color from toolbar options
    const selectedWidth = parseInt(document.getElementById('line-width').value, 10);
    const selectedColor = document.getElementById('line-color').value;

    // Ensure free drawing brush exists and apply settings
    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = selectedWidth;  // Set the brush width
        canvas.freeDrawingBrush.color = selectedColor;  // Set the brush color
    }

    // Add event listeners to update the brush settings dynamically
    document.getElementById('line-width').addEventListener('change', function() {
        canvas.freeDrawingBrush.width = parseInt(this.value, 10);  // Update brush width dynamically
    });

    document.getElementById('line-color').addEventListener('change', function() {
        canvas.freeDrawingBrush.color = this.value;  // Update brush color dynamically
    });

    showToolbar();  // Keep the toolbar visible for adjusting settings
    saveCurrentPageAnnotations(canvas, currentPage);
}
  // Highlighter Tool
  function addHighlighter() {
    deactivateAllTools();
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 15; // Set a thicker brush
    canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)'; // Set transparent yellow for highlighter
    showToolbar();
    saveCurrentPageAnnotations(canvas, currentPage);
  }
  
  // Line Tool
  function addLine() {
    deactivateAllTools();  // Deactivate all other tools
    let isDrawing = false;
    let line;

    // Mouse down: Start drawing the line
    canvas.on('mouse:down', function(o) {
        isDrawing = true;
        const pointer = canvas.getPointer(o.e);
        const strokeWidth = parseInt(document.getElementById('line-width').value, 10);
        const strokeColor = document.getElementById('line-color').value;

        line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            strokeWidth: strokeWidth,
            stroke: strokeColor,
            selectable: true,
            evented: false,  // Temporarily disable interactions while drawing
        });
        canvas.add(line);
    });

    // Mouse move: Adjust the endpoint of the line
    canvas.on('mouse:move', function(o) {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    });

    // Mouse up: Finish drawing the line
    canvas.on('mouse:up', function() {
        isDrawing = false;
        line.set({
            evented: true,  // Re-enable object interaction after drawing
        });
        canvas.setActiveObject(line);
        canvas.off('mouse:down');
        canvas.off('mouse:move');
    });
    saveCurrentPageAnnotations(canvas, currentPage);
}

function addCircle() {
  deactivateAllTools();  // Deactivate all other tools
  let isDrawing = false;
  let circle;

  canvas.on('mouse:down', function(o) {
      isDrawing = true;
      const pointer = canvas.getPointer(o.e);
      const strokeWidth = parseInt(document.getElementById('line-width').value, 10);
      const strokeColor = document.getElementById('line-color').value;

      circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'transparent',
          selectable: true,
          evented: false,  // Temporarily disable interactions
      });
      canvas.add(circle);
  });

  canvas.on('mouse:move', function(o) {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      const radius = Math.sqrt(Math.pow(pointer.x - circle.left, 2) + Math.pow(pointer.y - circle.top, 2));
      circle.set({ radius: radius });
      canvas.renderAll();
  });

  canvas.on('mouse:up', function() {
      isDrawing = false;
      circle.set({
          evented: true,  // Re-enable interactions after drawing
      });
      canvas.setActiveObject(circle);
      canvas.off('mouse:down');
      canvas.off('mouse:move');
  });
  saveCurrentPageAnnotations(canvas, currentPage);
}

function addRectangle() {
  deactivateAllTools();  // Deactivate all other tools
  let isDrawing = false;
  let rect;

  canvas.on('mouse:down', function(o) {
      isDrawing = true;
      const pointer = canvas.getPointer(o.e);
      const strokeWidth = parseInt(document.getElementById('line-width').value, 10);
      const strokeColor = document.getElementById('line-color').value;

      rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'transparent',
          selectable: true,
          evented: false,  // Temporarily disable interactions
      });
      canvas.add(rect);
  });

  canvas.on('mouse:move', function(o) {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      rect.set({ width: pointer.x - rect.left, height: pointer.y - rect.top });
      canvas.renderAll();
  });

  canvas.on('mouse:up', function() {
      isDrawing = false;
      rect.set({
          evented: true,  // Re-enable interactions
      });
      canvas.setActiveObject(rect);
      canvas.off('mouse:down');
      canvas.off('mouse:move');
  });
  saveCurrentPageAnnotations(canvas, currentPage);
}

function addTriangle() {
  deactivateAllTools();  // Deactivate all other tools
  let isDrawing = false;
  let triangle;

  canvas.on('mouse:down', function(o) {
      isDrawing = true;
      const pointer = canvas.getPointer(o.e);
      const strokeWidth = parseInt(document.getElementById('line-width').value, 10);
      const strokeColor = document.getElementById('line-color').value;

      triangle = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          strokeWidth: strokeWidth,
          stroke: strokeColor,
          fill: 'transparent',
          selectable: true,
          evented: false,  // Temporarily disable interactions
      });
      canvas.add(triangle);
  });

  canvas.on('mouse:move', function(o) {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      triangle.set({ width: pointer.x - triangle.left, height: pointer.y - triangle.top });
      canvas.renderAll();
  });

  canvas.on('mouse:up', function() {
      isDrawing = false;
      triangle.set({
          evented: true,  // Re-enable interactions
      });
      canvas.setActiveObject(triangle);
      canvas.off('mouse:down');
      canvas.off('mouse:move');
  });
  saveCurrentPageAnnotations(canvas, currentPage);
}
  
function deactivateAllTools() {
  canvas.isDrawingMode = false;  // Turn off drawing mode
  canvas.selection = true;  // Re-enable selection for objects
  
  // Deselect active objects, if any
  if (canvas.getActiveObject()) {
    canvas.discardActiveObject();
  }

  // Clear only the event listeners relevant to drawing mode
  canvas.off('mouse:down');
  canvas.off('mouse:move');
  canvas.off('mouse:up');
  
  // This will make sure other toolbars are still visible
  hideToolbar();
}
    
  // Show/Hide Free Draw Toolbar (or other toolbars if needed)
  function showToolbar() {
    document.getElementById('free-draw-toolbar').style.display = 'flex';
  }
  
  function hideToolbar() {
    // Prevent hiding the toolbar options
    document.getElementById('free-draw-toolbar').style.display = 'flex';
    document.getElementById('text-options').style.display = 'flex'; // Keep font settings visible
  }
  
  
  // Pointer tool for selecting objects
function selectPointer() {
  deactivateAllTools();  // Ensure all other tools are deactivated

  // Enable object selection on the canvas
  canvas.selection = true;  // Allow users to select objects
  canvas.isDrawingMode = false;  // Disable any drawing mode
  canvas.defaultCursor = 'default';  // Set the cursor to default
}
