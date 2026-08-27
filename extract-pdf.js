const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractPdf() {
  try {
    const pdfPath = path.join(__dirname, 'Calculus_of_variations.pdf');
    console.log('Reading PDF from:', pdfPath);
    
    const dataBuffer = fs.readFileSync(pdfPath);
    
    console.log('Parsing PDF (this might take a few seconds)...');
    const data = await pdfParse(dataBuffer);
    
    const outPath = path.join(__dirname, 'src', 'data', 'pdf_knowledge.txt');
    fs.writeFileSync(outPath, data.text, 'utf-8');
    
    console.log(`Successfully extracted ${data.numpages} pages of text.`);
    console.log(`Saved to ${outPath}`);
  } catch (error) {
    console.error('Error extracting PDF:', error);
    process.exit(1);
  }
}

extractPdf();
