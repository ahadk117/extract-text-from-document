const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse'); // For text-based PDFs
const poppler = require('pdf-poppler'); // For PDF-to-image conversion
const Tesseract = require('tesseract.js'); // For OCR on image-based PDFs

const app = express();
const port = 3000;

// Serve static files (e.g., index.html)
app.use(express.static(path.join(__dirname)));

// Configure file upload with Multer
const upload = multer({ dest: 'uploads/' });

// Function to check if the file is an image
const isImageFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.bmp', '.gif'].includes(ext);
};

// Function to check if the PDF is text-based
const isTextBasedPDF = async (pdfPath) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    return data.text.trim().length > 0;
  } catch (error) {
    console.error('Error checking PDF type:', error);
    return false;
  }
};

// Function to extract text from text-based PDF
const extractTextFromTextBasedPDF = async (pdfPath) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    console.log(data.text)
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
};

// Function to convert PDF to an image
const convertPdfToImage = async (pdfPath, outputDir) => {
  const options = {
    format: 'png',
    out_dir: outputDir,
    out_prefix: 'image',
    page: null,
  };

  try {
    await poppler.convert(pdfPath, options);
    return path.join(outputDir, 'image-1.png');
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw error;
  }
};

// Function to perform OCR on an image
const extractTextFromImage = (imagePath) => {
  return Tesseract.recognize(imagePath, 'eng', {
    logger: (m) => console.log(m),
  })
    .then(({ data: { text } }) => text)
    .catch((error) => {
      console.error('Error with OCR:', error);
      throw error;
    });
};

// Main function to extract text from file
// Main function to extract text from file
const extractTextFromFile = async (filePath, outputDir) => {
    console.log('Processing file:', filePath);
  
    const fileExtension = path.extname(filePath).toLowerCase();
    console.log('File extension:', fileExtension);
  
    if (isImageFile(filePath)) {
      console.log('File is an image. Performing OCR...');
      const extractedText = await extractTextFromImage(filePath);
      return extractedText;
    } else if (fileExtension === '.pdf') {
      const isTextBased = await isTextBasedPDF(filePath);
      if (isTextBased) {
        console.log('PDF is text-based. Extracting text...');
        const extractedText = await extractTextFromTextBasedPDF(filePath);
        return extractedText;
      } else {
        console.log('PDF is image-based. Converting to image and extracting text...');
        const imagePath = await convertPdfToImage(filePath, outputDir);
        if (imagePath) {
          const extractedText = await extractTextFromImage(imagePath);
          return extractedText;
        }
      }
    } else {
      console.error('Unsupported file type:', fileExtension);
      throw new Error('Unsupported file type');
    }
  };
  
  // Define the upload route
  app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Uploaded File:', req.file);
  
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
  
    const uploadedFilePath = req.file.path;
    const originalExtension = path.extname(req.file.originalname); // Get original file extension
    const correctedFilePath = `${uploadedFilePath}${originalExtension}`; // Add extension back
  
    // Rename file to include extension
    fs.renameSync(uploadedFilePath, correctedFilePath);
  
    const outputDir = 'output/';
  
    try {
      const extractedText = await extractTextFromFile(correctedFilePath, outputDir);
      res.status(200).send(`<pre>${extractedText}</pre>`); // Display the extracted text in the browser
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).send('Error processing file');
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
