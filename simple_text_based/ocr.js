const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse"); // For text-based PDFs
const poppler = require("pdf-poppler"); // For PDF-to-image conversion
const Tesseract = require("tesseract.js"); // For OCR on image-based PDFs

// Function to check if the file is an image based on extension
const isImageFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".bmp", ".gif"].includes(ext);
};

// Function to check if the PDF is text-based or image-based
const isTextBasedPDF = async (pdfPath) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    return data.text.trim().length > 0; // If text exists, it's a text-based PDF
  } catch (error) {
    console.error("Error checking PDF type:", error);
    return false; // In case of any error, treat as image-based PDF
  }
};

// Function to extract text from a text-based PDF
const extractTextFromTextBasedPDF = async (pdfPath) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(pdfBuffer);
    console.log("Text from Text-Based PDF:", data.text);
  } catch (error) {
    console.error("Error extracting text from text-based PDF:", error);
  }
};

// Function to convert PDF to an image
const convertPdfToImage = async (pdfPath, outputDir) => {
  const options = {
    format: "png", // Output format of the image
    out_dir: outputDir, // Directory to save the images
    out_prefix: "image", // Prefix for the image file names
    page: null, // Convert all pages (or specify page numbers)
  };

  try {
    await poppler.convert(pdfPath, options);
    console.log("PDF converted to image successfully!");
    return path.join(outputDir, "image-1.png"); // Assuming the first image
  } catch (error) {
    console.error("Error converting PDF to image:", error);
  }
};

// Function to perform OCR on the image using Tesseract
const extractTextFromImage = (imagePath) => {
  Tesseract.recognize(
    imagePath, // Path to the image converted from PDF
    "eng", // Language (English in this case)
    {
      logger: (m) => console.log(m), // Optional logger to track progress
    }
  )
    .then(({ data: { text } }) => {
      console.log("Text extracted from OCR:", text);
    })
    .catch((error) => {
      console.error("Error with OCR:", error);
    });
};

// Main function to handle both image-based and text-based PDFs
const extractTextFromFile = async (filePath, outputDir) => {
  if (isImageFile(filePath)) {
    console.log("File is an image. Performing OCR...");
    extractTextFromImage(filePath); // Perform OCR directly on the image
  } else if (path.extname(filePath).toLowerCase() === ".pdf") {
    const isTextBased = await isTextBasedPDF(filePath);

    if (isTextBased) {
      console.log("PDF is text-based. Extracting text...");
      await extractTextFromTextBasedPDF(filePath); // Extract text from text-based PDF
    } else {
      console.log(
        "PDF is image-based. Converting to image and extracting text..."
      );
      const imagePath = await convertPdfToImage(filePath, outputDir);
      if (imagePath) {
        extractTextFromImage(imagePath); // Perform OCR on the converted image
      }
    }
  } else {
    console.log("Unsupported file type.");
  }
};

// Example usage
const filePath = "Minal_Rent_Agreement.pdf"; // Path to your PDF (text-based or image-based)
const outputDir = "D:/xampp/htdocs/personal/node/output"; // Directory to save converted images
extractTextFromFile(filePath, outputDir);
