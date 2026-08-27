import { slides } from './src/data/slides';
import * as fs from 'fs';

let md = `---
marp: true
math: katex
theme: default
---

<style>
section {
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  font-size: 22px !important;
  padding: 50px 70px !important;
}
h1 {
  font-size: 36px !important;
  color: #0055ff !important;
  margin-top: 0 !important;
  margin-bottom: 30px !important;
}
p, li {
  line-height: 1.4 !important;
}
</style>

`;

for (const slide of slides) {
    let content = slide.content.trim();
    // Fix image paths
    content = content.replace(/\]\(\/([^\)]+)\)/g, '](public/$1)');
    
    // Split by double newline to get paragraphs/blocks
    const blocks = content.split(/\n\s*\n/);
    
    let currentChunk: string[] = [];
    let linesInChunk = 0;
    let slideIndex = 1;

    for (const block of blocks) {
        // Count approximate visual lines for this block (very rough heuristic)
        // A block with $$ takes extra vertical space
        let blockCost = block.split('\n').length;
        if (block.includes('$$')) {
            blockCost += 4; // Math blocks take more space
        }
        if (block.includes('![')) {
            blockCost += 10; // Images take a lot of space
        }
        
        // If adding this block exceeds our threshold (approx 15-20 lines) and we already have content
        if (linesInChunk + blockCost > 18 && currentChunk.length > 0) {
            const titleSuffix = slideIndex > 1 ? ` (cont.)` : '';
            md += `# ${slide.title}${titleSuffix}\n\n${currentChunk.join('\n\n')}\n\n---\n\n`;
            
            currentChunk = [];
            linesInChunk = 0;
            slideIndex++;
        }
        
        currentChunk.push(block);
        linesInChunk += blockCost;
    }
    
    if (currentChunk.length > 0) {
        const titleSuffix = slideIndex > 1 ? ` (cont.)` : '';
        md += `# ${slide.title}${titleSuffix}\n\n${currentChunk.join('\n\n')}\n\n---\n\n`;
    }
}

// remove last ---
md = md.slice(0, -5);

fs.writeFileSync('presentation.md', md);
console.log('presentation.md generated');
