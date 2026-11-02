const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed!');
  process.exit(1);
}

const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');
const staticDir = path.join(__dirname, '.next', 'static');
const publicDir = path.join(__dirname, 'public');

console.log('📂 Copying static assets to standalone directory...');

// Ensure .next/standalone/.next exists
if (!fs.existsSync(standaloneNextDir)) {
  fs.mkdirSync(standaloneNextDir, { recursive: true });
}

// Copy .next/static to .next/standalone/.next/static
if (fs.existsSync(staticDir)) {
  fs.cpSync(staticDir, path.join(standaloneNextDir, 'static'), { recursive: true });
}

// Copy public to .next/standalone/public
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(standaloneDir, 'public'), { recursive: true });
}

console.log('✅ Build prepared successfully!');
console.log('');
console.log('📦 Next steps for Hostinger Node.js Hosting:');
console.log('1. Upload ALL contents inside the ".next/standalone" folder to your Hostinger file manager (usually public_html).');
console.log('2. In your Hostinger Node.js App settings, set the Application startup file to "server.js".');
console.log('3. Start the Node app!');
