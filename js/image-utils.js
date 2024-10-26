// image-utils.js

function renderImage(file, canvas) {
    const reader = new FileReader();
    reader.onload = function(event) {
      // Load the image as a low-resolution version first
      fabric.Image.fromURL(event.target.result, function(img) {
        const scaleFactor = Math.min(600 / img.width, 600 / img.height);  // Scale down to a smaller preview size
        img.scale(scaleFactor);  // Scale the image for preview
  
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
  
        // Load the high-resolution version in the background
        fabric.Image.fromURL(event.target.result, function(highResImg) {
          highResImg.scaleToWidth(canvas.getWidth());  // Scale high-res image
          canvas.setBackgroundImage(highResImg, canvas.renderAll.bind(canvas));
        });
      }, { crossOrigin: 'Anonymous' });
    };
    reader.readAsDataURL(file);
  }
  