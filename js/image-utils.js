function renderImage(file, canvas) {
  PDFState.isPDF = false;
  const reader = new FileReader();
  reader.onload = function(event) {
    // Set desired canvas size (for example, 800x600)
    const canvasWidth = 800;
    const canvasHeight = 600;
    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);

    // Load the image and scale it to fit within the canvas while maintaining aspect ratio
    fabric.Image.fromURL(event.target.result, function(img) {
      // Calculate scale factor to fit image within canvas
      const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      img.scale(scaleFactor);

      // Center the image on the canvas
      img.set({
        left: (canvasWidth - img.getScaledWidth()) / 2,
        top: (canvasHeight - img.getScaledHeight()) / 2,
        originX: 'left',
        originY: 'top'
      });

      // Set the image as the background
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

      console.log("Image scaled to fit canvas dimensions with aspect ratio maintained.");
    }, { crossOrigin: 'Anonymous' });
  };
  reader.readAsDataURL(file);
}
