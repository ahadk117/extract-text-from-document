const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Path to the original image
const imagePath = path.join(__dirname, 'img_2.jpeg');
const preprocessedImagePath = path.join(__dirname, 'preprocessed-image.png');

// Preprocess the image using sharp
sharp(imagePath)
  .resize(1200) // Resize the image to increase clarity (optional)
  .grayscale() // Convert image to grayscale
  .normalize() // Normalize the image to improve contrast
  .threshold(200) // Apply a higher threshold to enhance contrast (adjust as needed)
  .toFile(preprocessedImagePath, (err, info) => {
    if (err) {
      console.error('Error during preprocessing:', err);
      return;
    }

    // Perform OCR on the preprocessed image
    Tesseract.recognize(
      preprocessedImagePath, // Path to the preprocessed image
      'eng', // Language code for English
      {
        logger: (info) => console.log(info), // Optional logger
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // Customize allowed characters if needed
      }
    )
      .then(({ data: { text } }) => {
        console.log('Extracted Text:', text);
      })
      .catch((error) => {
        console.error('Error during OCR:', error);
      })
      .finally(() => {
        // Clean up preprocessed image if desired
        fs.unlinkSync(preprocessedImagePath);
      });
  });
