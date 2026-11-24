import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Trust & Compliance Pages: Privacy, About, Terms, Contact & Disclaimer', () => {
  const rootDir = process.cwd();
  const pagesDir = path.join(rootDir, 'src/pages');

  it('verifies all 5 trust & compliance Astro files exist', () => {
    const requiredFiles = [
      'privacy.astro',
      'about.astro',
      'terms.astro',
      'contact.astro',
      'disclaimer.astro',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(pagesDir, file);
      expect(fs.existsSync(filePath), `${file} must exist`).toBe(true);
    }
  });

  it('verifies Privacy Policy (/privacy/) contains full data guarantees and GDPR/CCPA coverage', () => {
    const content = fs.readFileSync(path.join(pagesDir, 'privacy.astro'), 'utf8');

    // Title and description
    expect(content).toContain('title="Privacy Policy - Seller Calc Hub"');
    expect(content).toContain('canonicalPath="/privacy/"');

    // Guarantees
    expect(content).toContain('Client-Side Calculation Guarantee');
    expect(content).toContain('Information We Do NOT Collect');
    expect(content).toContain('Cookies &amp; Local Browser Storage');
    expect(content).toContain('sch_theme');
    expect(content).toContain('sch_privacy_notice_dismissed');
    expect(content).toContain('Advertising &amp; Future Monetization');

    // Statutory compliance
    expect(content).toContain('GDPR');
    expect(content).toContain('CCPA / CPRA');
    expect(content).toContain('COPPA');
    expect(content).toContain('info@sellercalchub.com');
    expect(content).not.toContain('privacy@sellercalchub.com');

    // Schema
    expect(content).toContain('@type\': \'WebPage');
  });

  it('verifies About Us (/about/) contains mission, 5 core commitments and roadmap', () => {
    const content = fs.readFileSync(path.join(pagesDir, 'about.astro'), 'utf8');

    // Title and canonical
    expect(content).toContain('canonicalPath="/about/"');
    expect(content).toContain('@type\': \'AboutPage');

    // Commitments and content
    expect(content).toContain('Built for Online Resellers Who Value Precision');
    expect(content).toContain('100% Free Forever with Zero Distracting Popups');
    expect(content).toContain('Strict Zero-Hallucination Rate Integrity');
    expect(content).toContain('Sub-Second Static Performance (Astro SSG)');
    expect(content).toContain('Local Browser Privacy First');
    expect(content).toContain('WCAG AA Accessible by Design');

    // Platforms
    expect(content).toContain('eBay US & UK');
    expect(content).toContain('Whatnot');
    expect(content).toContain('TikTok Shop');
    expect(content).toContain('Etsy & Offsite Ads');
    expect(content).toContain('Depop');
    expect(content).toContain('Twitch Bits');
  });

  it('verifies Terms of Service (/terms/) contains estimates disclaimer, embed terms and non-affiliation', () => {
    const content = fs.readFileSync(path.join(pagesDir, 'terms.astro'), 'utf8');

    expect(content).toContain('canonicalPath="/terms/"');
    expect(content).toContain('Calculations Are Estimates Only');
    expect(content).toContain('No Accounting, Tax, or Legal Advice');
    expect(content).toContain('Marketplace Trademark &amp; Non-Affiliation Disclaimer');
    expect(content).toContain('Embeddable Calculator Widgets Terms of Use');
    expect(content).toContain('Limitation of Liability');
    expect(content).toContain('info@sellercalchub.com');
    expect(content).not.toContain('legal@sellercalchub.com');

    // Explicit platforms listed
    expect(content).toContain('eBay Inc.');
    expect(content).toContain('Etsy, Inc.');
    expect(content).toContain('Whatnot, Inc.');
    expect(content).toContain('TikTok');
    expect(content).toContain('Depop');
  });

  it('verifies Contact Us (/contact/) contains 4 priority desks, interactive form, and SLA guarantee', () => {
    const content = fs.readFileSync(path.join(pagesDir, 'contact.astro'), 'utf8');

    expect(content).toContain('canonicalPath="/contact/"');
    expect(content).toContain('@type\': \'ContactPage');

    // Unified Contact Email & Gmail / Copy support
    expect(content).toContain('info@sellercalchub.com');
    expect(content).toContain('EmailAction');
    expect(content).not.toContain('corrections@sellercalchub.com');
    expect(content).not.toContain('hello@sellercalchub.com');
    expect(content).not.toContain('privacy@sellercalchub.com');
    expect(content).not.toContain('legal@sellercalchub.com');

    // EmailAction component verifies Gmail direct link and clipboard copy
    const emailActionContent = fs.readFileSync(path.join(rootDir, 'src/components/EmailAction.astro'), 'utf8');
    expect(emailActionContent).toContain('https://mail.google.com/mail/');
    expect(emailActionContent).toContain('data-copy-email');

    // SLA
    expect(content).toContain('24–48 hours');

    // Accessible form controls
    expect(content).toContain('id="contact-form"');
    expect(content).toContain('id="contact-email"');
    expect(content).toContain('id="contact-subject"');
    expect(content).toContain('id="contact-message"');
    expect(content).toContain('id="hp-company"'); // Honeypot
    expect(content).toContain('id="contact-status-banner"');
  });

  it('verifies all 4 pages are linked in Header and Footer', () => {
    const headerContent = fs.readFileSync(path.join(rootDir, 'src/components/Header.astro'), 'utf8');
    const footerContent = fs.readFileSync(path.join(rootDir, 'src/components/Footer.astro'), 'utf8');

    // Header has About and Contact in desktop nav & mobile
    expect(headerContent).toContain('href="/about/"');
    expect(headerContent).toContain('href="/contact/"');

    // Footer has all 4 in its navigation links
    expect(footerContent).toContain("href: '/about/'");
    expect(footerContent).toContain("href: '/contact/'");
    expect(footerContent).toContain("href: '/privacy/'");
    expect(footerContent).toContain("href: '/terms/'");
  });
});
