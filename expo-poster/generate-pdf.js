const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const posterDir = path.resolve(__dirname);
  const htmlPath = path.join(posterDir, 'index.html');
  const pdfPath = path.join(posterDir, 'expo-poster.pdf');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Poster HTML not found at ${htmlPath}`);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });
  await browser.close();
  console.log(`PDF generated: ${pdfPath}`);
})();
