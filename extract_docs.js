const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function extractPdf(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

async function main() {
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx') || f.endsWith('.pdf'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${file}`);
    console.log(`SIZE: ${fs.statSync(filePath).size} bytes`);
    console.log(`${'='.repeat(80)}`);
    
    let content;
    if (ext === '.docx') {
      content = await extractDocx(filePath);
    } else if (ext === '.pdf') {
      content = await extractPdf(filePath);
    }
    
    console.log(content);
  }
}

main().catch(console.error);
