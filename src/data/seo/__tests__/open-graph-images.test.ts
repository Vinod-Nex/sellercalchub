import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { OG_IMAGES } from '../../../../scripts/generate-og-images';

describe('Phase 35: Open Graph, Social Images & Responsive Design', () => {
  const rootDir = process.cwd();
  const publicOgDir = path.join(rootDir, 'public/og');

  it('generates 1200x630 PNG images for all defined pages at build time', () => {
    expect(fs.existsSync(publicOgDir), 'public/og directory must exist').toBe(true);

    for (const def of OG_IMAGES) {
      const filePath = path.join(publicOgDir, def.filename);
      expect(fs.existsSync(filePath), `OG image ${def.filename} must exist`).toBe(true);

      const buffer = fs.readFileSync(filePath);
      // Valid PNG header check: \x89PNG\r\n\x1a\n
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x4e); // N
      expect(buffer[3]).toBe(0x47); // G

      // Read PNG IHDR dimensions: width at byte offset 16, height at byte offset 20
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);

      expect(width, `${def.filename} width must be 1200`).toBe(1200);
      expect(height, `${def.filename} height must be 630`).toBe(630);
    }
  });

  it('every OG image definition includes title, platform name, and a sample result', () => {
    for (const def of OG_IMAGES) {
      expect(def.title.length, `Title on ${def.slug} must not be empty`).toBeGreaterThan(3);
      expect(def.platformName.length, `Platform on ${def.slug} must not be empty`).toBeGreaterThan(2);
      expect(def.sampleResult.length, `Sample result on ${def.slug} must not be empty`).toBeGreaterThan(10);
    }
  });

  it('Head.astro renders all required Open Graph and Twitter summary_large_image tags', () => {
    const headPath = path.join(rootDir, 'src/components/Head.astro');
    const headContent = fs.readFileSync(headPath, 'utf8');

    // og:title, og:description, og:url, og:type, og:image with alt, and twitter:card summary_large_image
    expect(headContent).toContain('<meta property="og:type"');
    expect(headContent).toContain('<meta property="og:title"');
    expect(headContent).toContain('<meta property="og:description"');
    expect(headContent).toContain('<meta property="og:url"');
    expect(headContent).toContain('<meta property="og:image"');
    expect(headContent).toContain('<meta property="og:image:alt"');
    expect(headContent).toContain('<meta property="og:image:width" content="1200"');
    expect(headContent).toContain('<meta property="og:image:height" content="630"');
    expect(headContent).toContain('<meta property="og:image:type" content="image/png"');

    expect(headContent).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(headContent).toContain('<meta name="twitter:title"');
    expect(headContent).toContain('<meta name="twitter:description"');
    expect(headContent).toContain('<meta name="twitter:image"');
    expect(headContent).toContain('<meta name="twitter:image:alt"');
  });

  it('Check: social preview renders in card debugger (/social-preview-debugger/)', () => {
    const debuggerPath = path.join(rootDir, 'src/pages/social-preview-debugger.astro');
    expect(fs.existsSync(debuggerPath), 'social-preview-debugger.astro must exist').toBe(true);

    const content = fs.readFileSync(debuggerPath, 'utf8');
    // Previews Twitter card & Facebook card
    expect(content).toContain('Twitter');
    expect(content).toContain('summary_large_image');
    expect(content).toContain('Open Graph');
    expect(content).toContain('Active Meta Tags Inspector');
    expect(content).toContain('1200');
    expect(content).toContain('630');
  });

  it('verifies responsive design tokens, fluid typography and layout rules', () => {
    const globalCssPath = path.join(rootDir, 'src/styles/global.css');
    const cssContent = fs.readFileSync(globalCssPath, 'utf8');

    // Fluid typography on mobile (<= 640px)
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)/);
    expect(cssContent).toContain('--text-display-xl');
    expect(cssContent).toContain('--text-display-lg');

    // No-scrollbar and responsive table container
    expect(cssContent).toContain('.no-scrollbar');
    expect(cssContent).toContain('.table-responsive');

    // CalculatorIsland responsive padding & horizontal tab scroll
    const calcIslandPath = path.join(rootDir, 'src/components/CalculatorIsland.astro');
    const calcContent = fs.readFileSync(calcIslandPath, 'utf8');
    expect(calcContent).toContain('p-4 sm:p-6 md:p-8');
    expect(calcContent).toContain('no-scrollbar');

    // Header & Footer max-width container
    const headerPath = path.join(rootDir, 'src/components/Header.astro');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    expect(headerContent).toContain('max-w-7xl');
    expect(headerContent).toContain('w-[calc(100vw-2rem)]'); // Mobile dropdown safety
  });
});
