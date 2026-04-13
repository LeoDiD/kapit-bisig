const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');

const colorMap = {
  "'#16A34A'": "theme.colors.primary",
  "'#2E7D32'": "theme.colors.primary",
  "'#166534'": "theme.colors.primaryDark",
  "'#15803D'": "theme.colors.primaryDark",
  "'#DCFCE7'": "theme.colors.primaryLight",
  "'#ECC323'": "theme.colors.accent",
  "'#EF4444'": "theme.colors.error",
  "'#B00020'": "theme.colors.error",
  "'#FFFFFF'": "theme.colors.surface",
  "'#F8FAF9'": "theme.colors.background",
  "'#1F2937'": "theme.colors.textPrimary",
  "'#374151'": "theme.colors.textPrimary",
  "'#4B5563'": "theme.colors.textSecondary",
  "'#6B7280'": "theme.colors.textSecondary",
  "'#9CA3AF'": "theme.colors.textMuted",
  "'#E5E7EB'": "theme.colors.border",
  "'#E0E0E0'": "theme.colors.border",
  "'#EEF2F7'": "theme.colors.border",
  "'#F3F4F6'": "theme.colors.divider",
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  for (const [hex, themeVar] of Object.entries(colorMap)) {
    // We only want to replace it if it's not already dynamic (but here hex is literally like '#FFFFFF')
    const regex = new RegExp(hex, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, themeVar);
      hasChanges = true;
    }
  }

  // Also replace some lowercase hex just in case
  const lowerColorMap = Object.entries(colorMap).map(([k, v]) => [k.toLowerCase(), v]);
  for (const [hex, themeVar] of lowerColorMap) {
    const regex = new RegExp(hex, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, themeVar);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    // Check if it already imports theme
    if (!content.includes('from \'../theme\'') && !content.includes('from \'../../theme\'')) {
      const depth = filePath.split(path.sep).length - componentsDir.split(path.sep).length;
      const themeImportPath = depth === 1 ? "'../theme'" : "'../../theme'";
      
      // Attempt to insert import near top
      const lines = content.split('\n');
      let importIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          importIndex = i + 1;
        }
      }
      lines.splice(importIndex, 0, `import { theme } from ${themeImportPath};`);
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      // Don't auto-replace inside UI components completely unless needed, but it's okay mostly.
      processFile(fullPath);
    }
  }
}

traverse(componentsDir);
console.log('Color refactor complete.');
