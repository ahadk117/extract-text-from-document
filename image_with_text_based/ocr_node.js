const { exec } = require("child_process");
const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");

// Function to convert PDF pages to images
async function convertPdfToImages(pdfPath, outputDir) {
  return new Promise((resolve, reject) => {
    exec(`pdftoppm -png ${pdfPath} ${outputDir}/page`, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(); // Resolves when all images are created
    });
  });
}

// Function to extract text from a single image using Tesseract
async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");
    return text;
  } catch (err) {
    console.error(`Error extracting text from ${imagePath}:`, err);
    return "";
  }
}

// Function to process all pages of the PDF
async function processPdf(pdfPath, outputDir) {
  try {
    // Step 1: Convert PDF to images
    await convertPdfToImages(pdfPath, outputDir);
    console.log("PDF successfully converted to images.");

    // Step 2: Get the list of all generated image files
    const images = fs.readdirSync(outputDir).filter(file => file.endsWith(".png"));
    if (images.length === 0) {
      console.error("No images were generated from the PDF.");
      return;
    }

    // Step 3: Perform OCR on each image
    let extractedText = "";
    for (const image of images) {
      const imagePath = path.join(outputDir, image);
      console.log(`Processing image: ${imagePath}`);
      const text = await extractTextFromImage(imagePath);
      extractedText += text + "\n";
    }

    // Step 4: Print or save the extracted text
    console.log("Extracted Text:\n", extractedText);

    // Optionally save the text to a file
    fs.writeFileSync("extracted_text.txt", extractedText, "utf8");
    console.log("Extracted text saved to extracted_text.txt.");
  } catch (error) {
    console.error("Error processing PDF:", error);
  }
}

// Example usage:
const pdfPath = "mumbai_rent.pdf"; // Path to your PDF file
const outputDir = "./output"; // Directory to store images
fs.mkdirSync(outputDir, { recursive: true }); // Ensure output directory exists
processPdf(pdfPath, outputDir);
