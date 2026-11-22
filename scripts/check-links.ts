import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

const htmlFiles = getAllHtmlFiles(distDir);
console.log(`Found ${htmlFiles.length} HTML files to inspect for broken links...`);

let totalLinksChecked = 0;
const brokenLinks: { sourceFile: string; targetUrl: string; reason: string }[] = [];

// Regex to extract href attributes from <a> and <link> tags
const hrefRegex = /<(?:a|link)\s+[^>]*?href=["']([^"']+)["']/gi;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relativeSource = path.relative(distDir, file);

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(content)) !== null) {
    const rawHref = match[1].trim();
    totalLinksChecked++;

    // Skip empty, anchors, mailto, tel, javascript, data URLs
    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('data:')
    ) {
      continue;
    }

    // External URLs - validate structure
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      try {
        new URL(rawHref);
      } catch {
        brokenLinks.push({
          sourceFile: relativeSource,
          targetUrl: rawHref,
          reason: 'Invalid external URL format',
        });
      }
      continue;
    }

    // Internal URLs
    const urlWithoutHashOrQuery = rawHref.split('#')[0].split('?')[0];
    if (!urlWithoutHashOrQuery) {
      continue;
    }

    let resolvedPath: string;
    if (urlWithoutHashOrQuery.startsWith('/')) {
      resolvedPath = path.join(distDir, urlWithoutHashOrQuery);
    } else {
      resolvedPath = path.join(path.dirname(file), urlWithoutHashOrQuery);
    }

    // Check potential target file variations:
    // 1. Exact match (e.g. /favicon.ico, /robots.txt)
    // 2. Directory with index.html (e.g. /about/ -> dist/about/index.html)
    // 3. Extensionless html (e.g. /about -> dist/about/index.html or dist/about.html)
    const exists =
      (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) ||
      (fs.existsSync(path.join(resolvedPath, 'index.html')) && fs.statSync(path.join(resolvedPath, 'index.html')).isFile()) ||
      (fs.existsSync(`${resolvedPath}.html`) && fs.statSync(`${resolvedPath}.html`).isFile());

    if (!exists) {
      brokenLinks.push({
        sourceFile: relativeSource,
        targetUrl: rawHref,
        reason: `Target file not found (checked ${path.relative(distDir, resolvedPath)})`,
      });
    }
  }
}

console.log(`Checked ${totalLinksChecked} total links across ${htmlFiles.length} pages.`);

if (brokenLinks.length > 0) {
  console.error(`\n❌ Found ${brokenLinks.length} broken link(s):`);
  for (const b of brokenLinks) {
    console.error(`  - In "${b.sourceFile}": ${b.targetUrl} (${b.reason})`);
  }
  process.exit(1);
}

console.log('✅ All internal links resolved successfully! Zero broken links found.');
process.exit(0);
