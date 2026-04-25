const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  await parser.load();
  const result = await parser.getText();
  if (result && result.pages) {
    return result.pages.map(p => p.text || '').join('\n');
  }
  return typeof result === 'string' ? result : JSON.stringify(result);
}

function getUniqueContent(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const key = line.substring(0, 120); // dedup by first 120 chars
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }
  return unique;
}

function getSectionHeadings(lines) {
  // Headings are typically short lines (< 80 chars) that don't end with a period
  return lines.filter(l => l.length < 100 && l.length > 3 && !l.endsWith('.') && !l.includes('This section provides'));
}

async function main() {
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx') || f.endsWith('.pdf'));
  
  const output = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();
    
    let content;
    if (ext === '.docx') {
      content = await extractDocx(filePath);
    } else {
      content = await extractPdf(filePath);
    }
    
    const uniqueLines = getUniqueContent(content);
    const headings = getSectionHeadings(uniqueLines);
    
    output.push(`\n${'='.repeat(80)}`);
    output.push(`FILE: ${file}`);
    output.push(`SIZE: ${fs.statSync(filePath).size} bytes`);
    output.push(`TOTAL LINES (raw): ${content.split(/\r?\n/).filter(l=>l.trim()).length}`);
    output.push(`UNIQUE LINES: ${uniqueLines.length}`);
    output.push(`SECTION HEADINGS (${headings.length}):`);
    headings.forEach(h => output.push(`  >> ${h}`));
    output.push(`${'='.repeat(80)}`);
    output.push('--- UNIQUE CONTENT ---');
    // Output first 200 unique lines max per file to keep it manageable
    uniqueLines.slice(0, 200).forEach(l => output.push(l));
    if (uniqueLines.length > 200) {
      output.push(`\n... [${uniqueLines.length - 200} more unique lines truncated]`);
    }
  }
  
  fs.writeFileSync(path.join(dir, 'smart_extracted.txt'), output.join('\n'), 'utf8');
  console.log('Done! Written to smart_extracted.txt');
  console.log(`Total files processed: ${files.length}`);
}

main().catch(console.error);
