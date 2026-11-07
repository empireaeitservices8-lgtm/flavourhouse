const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Next.js app for Hostinger...');
try {
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, BUILD_STANDALONE: 'true' } });
} catch (error) {
  console.error('❌ Build failed!');
  process.exit(1);
}

const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');
const staticDir = path.join(__dirname, '.next', 'static');
const publicDir = path.join(__dirname, 'public');
const backendDir = path.join(__dirname, 'backend');

console.log('📂 Copying assets and backend into standalone directory...');

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

// Copy backend into standalone/backend (excluding node_modules)
const destBackend = path.join(standaloneDir, 'backend');
if (fs.existsSync(backendDir)) {
  fs.cpSync(backendDir, destBackend, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.git'),
  });
}

// Create production .env in standalone
const envContent = `# Production Environment for Hostinger
NODE_ENV=production
PORT=3000
BACKEND_PORT=4000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Fh@2026#SecureAdmin!
JWT_SECRET=flavorhouse_super_secret_jwt_key_2026
DATABASE_URL="mysql://u774473556_fhuser:FlavorHouse%402026%23Db%21@srv1882.hstgr.io:3306/u774473556_fhdb"
ADMIN_EMAIL=admin@flavorhousefoods.com
ADMIN_NAME="Flavour House Admin"
ALLOWED_ORIGINS=http://localhost:3000,https://flavorhousefoods.com,https://www.flavorhousefoods.com,https://flavorhouse-7161g3t17-empireae.vercel.app
`;
fs.writeFileSync(path.join(standaloneDir, '.env'), envContent, 'utf8');

// Patch standalone/server.js to start the Express backend
const serverJsPath = path.join(standaloneDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
  let content = fs.readFileSync(serverJsPath, 'utf8');
  if (!content.includes('backend/server.js')) {
    const startupHook = `
// ── Flavour House: Start internal Node.js Express backend ──
try {
  require('./backend/server.js');
  console.log('🌾 Flavour House internal Express backend spawned on port 4000');
} catch (e) {
  console.warn('⚠️ Could not start internal Express backend:', e.message);
}
`;
    content = startupHook + '\n' + content;
    fs.writeFileSync(serverJsPath, content, 'utf8');
  }
}

console.log('📦 Creating hostinger_deploy.zip package...');
try {
  const zipPath = path.join(__dirname, 'hostinger_deploy.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(`tar -a -cf "${zipPath}" -C "${standaloneDir}" .`, { stdio: 'inherit' });
  const stats = fs.statSync(zipPath);
  console.log(`✅ hostinger_deploy.zip created successfully! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (e) {
  console.error('⚠️ Could not create zip automatically:', e.message);
}

console.log('');
console.log('🎉 Charmika-style deployment package ready!');
console.log('1. Upload "hostinger_deploy.zip" to Hostinger public_html and extract it.');
console.log('2. Set Application startup file to "server.js" in Hostinger Node.js settings.');
console.log('3. Restart the Node.js application!');
