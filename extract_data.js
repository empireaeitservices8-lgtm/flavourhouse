const fs = require('fs');

const pageFile = "src/app/products/page.tsx";
let pageContent = fs.readFileSync(pageFile, 'utf8');

const startIdx = pageContent.indexOf('const PRODUCTS = [');
const endStr = "];\n\nconst CATEGORIES =";
const endIdx = pageContent.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const productsArray = pageContent.substring(startIdx, endIdx + 2); // gets the whole const PRODUCTS = [...];
  const dataFileContent = `export ${productsArray}\n\nexport const CATEGORIES = ["All", "Millet Pasta", "Vermicelli", "Healthy Noodles", "Healthy Cookies"];\n`;
  fs.writeFileSync("src/lib/data.ts", dataFileContent);
  
  // Now replace in page.tsx
  const before = pageContent.substring(0, startIdx);
  const after = pageContent.substring(pageContent.indexOf('export default function ProductsPage()'));
  
  const newPageContent = before + `import { PRODUCTS, CATEGORIES } from "@/lib/data";\n\n` + after;
  fs.writeFileSync(pageFile, newPageContent);
  console.log("Successfully extracted PRODUCTS and updated page.tsx");
} else {
  console.log("Could not find PRODUCTS array");
}
