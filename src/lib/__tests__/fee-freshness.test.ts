import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  runFreshnessAudit,
  manageGitHubFreshnessIssue,
  type MinimalOctokit,
} from '../../../scripts/check-fee-freshness';

describe('Fee Freshness Bot (Phase 30)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sch-fee-freshness-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects a stale test file older than 30 days and triggers the issue payload', () => {
    // 1. Write a fresh file (10 days old relative to reference date)
    const freshPayload = {
      platform: 'whatnot',
      platform_name: 'Whatnot Live',
      verified_on: '2026-11-12',
      source_url: 'https://help.whatnot.com/hc/en-us/articles/fees',
    };
    fs.writeFileSync(path.join(tempDir, 'whatnot.json'), JSON.stringify(freshPayload));

    // 2. Write a STALE test file (45 days old relative to reference date)
    const stalePayload = {
      platform: 'ebay-vintage-test',
      platform_name: 'eBay Vintage Test Marketplace',
      verified_on: '2026-10-08',
      source_url: 'https://pages.ebay.com/test-fees.html',
    };
    fs.writeFileSync(path.join(tempDir, 'ebay-test.json'), JSON.stringify(stalePayload));

    // 3. Run Freshness Audit using reference date 2026-11-22
    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');

    // Verification check: Stale test file must trigger the issue!
    expect(audit.totalFiles).toBe(2);
    expect(audit.staleCount).toBe(1);
    expect(audit.freshCount).toBe(1);

    const staleItem = audit.staleItems[0];
    expect(staleItem.platform).toBe('ebay-vintage-test');
    expect(staleItem.platformName).toBe('eBay Vintage Test Marketplace');
    expect(staleItem.verifiedOn).toBe('2026-10-08');
    expect(staleItem.daysElapsed).toBe(45);
    expect(staleItem.isStale).toBe(true);

    // Verify issue title and body content
    expect(audit.markdownIssueTitle).toContain('1 marketplace fee schedule(s) require reverification');
    expect(audit.markdownIssueBody).toContain('eBay Vintage Test Marketplace');
    expect(audit.markdownIssueBody).toContain('45 days');
    expect(audit.markdownIssueBody).toContain('https://pages.ebay.com/test-fees.html');
    expect(audit.markdownIssueBody).toContain('Checklist');
  });

  it('triggers a GitHub issue creation when a stale test file is detected', async () => {
    const stalePayload = {
      platform: 'tiktok-test-stale',
      platform_name: 'TikTok Shop Test',
      verified_on: '2026-09-01',
      source_url: 'https://seller-us.tiktok.com/fees',
    };
    fs.writeFileSync(path.join(tempDir, 'tiktok-stale.json'), JSON.stringify(stalePayload));

    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');

    // Mock Octokit
    const mockList = vi.fn().mockResolvedValue({ data: [] }); // No existing issue
    const mockCreate = vi.fn().mockResolvedValue({ data: { number: 101, html_url: 'https://github.com/issues/101' } });
    const mockUpdate = vi.fn().mockResolvedValue({ data: { number: 101 } });
    const mockComment = vi.fn().mockResolvedValue({ data: { id: 1 } });

    const mockOctokit: MinimalOctokit = {
      rest: {
        issues: {
          listForRepo: mockList,
          create: mockCreate,
          update: mockUpdate,
          createComment: mockComment,
        },
      },
    };

    const result = await manageGitHubFreshnessIssue(
      mockOctokit,
      { repo: { owner: 'Vinod-Nex', repo: 'sellercalchub' } },
      audit
    );

    // Verify GitHub issue was created for the stale file
    expect(result.action).toBe('created');
    expect(result.issueNumber).toBe(101);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('1 marketplace fee schedule(s) require reverification'),
        body: expect.stringContaining('TikTok Shop Test'),
        labels: ['fee-freshness', 'automated-audit', 'priority-medium'],
      })
    );
  });

  it('updates an existing open GitHub issue if one is already open', async () => {
    const stalePayload = {
      platform: 'etsy-stale',
      platform_name: 'Etsy Stale',
      verified_on: '2026-10-01',
      source_url: 'https://etsy.com/fees',
    };
    fs.writeFileSync(path.join(tempDir, 'etsy-stale.json'), JSON.stringify(stalePayload));

    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');

    const mockList = vi.fn().mockResolvedValue({ data: [{ number: 55, title: 'Old audit title' }] });
    const mockCreate = vi.fn();
    const mockUpdate = vi.fn().mockResolvedValue({ data: { number: 55 } });
    const mockComment = vi.fn().mockResolvedValue({ data: { id: 2 } });

    const mockOctokit: MinimalOctokit = {
      rest: {
        issues: {
          listForRepo: mockList,
          create: mockCreate,
          update: mockUpdate,
          createComment: mockComment,
        },
      },
    };

    const result = await manageGitHubFreshnessIssue(
      mockOctokit,
      { repo: { owner: 'Vinod-Nex', repo: 'sellercalchub' } },
      audit
    );

    expect(result.action).toBe('updated');
    expect(result.issueNumber).toBe(55);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 55,
        title: audit.markdownIssueTitle,
        body: audit.markdownIssueBody,
      })
    );
    expect(mockComment).toHaveBeenCalledTimes(1);
  });

  it('reports all files fresh when none are older than 30 days', () => {
    const recentPayload = {
      platform: 'etsy',
      platform_name: 'Etsy',
      verified_on: '2026-11-20',
      source_url: 'https://www.etsy.com/legal/fees',
    };
    fs.writeFileSync(path.join(tempDir, 'etsy.json'), JSON.stringify(recentPayload));

    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');

    expect(audit.staleCount).toBe(0);
    expect(audit.freshCount).toBe(1);
    expect(audit.markdownIssueBody).toContain('All marketplace fee schedules are up-to-date');
  });

  it('closes an open issue when all fee files become fresh', async () => {
    const freshPayload = {
      platform: 'whatnot',
      platform_name: 'Whatnot Live',
      verified_on: '2026-11-20',
      source_url: 'https://whatnot.com/fees',
    };
    fs.writeFileSync(path.join(tempDir, 'whatnot.json'), JSON.stringify(freshPayload));

    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');

    const mockList = vi.fn().mockResolvedValue({ data: [{ number: 77, title: 'Previous stale audit' }] });
    const mockCreate = vi.fn();
    const mockUpdate = vi.fn().mockResolvedValue({ data: { number: 77 } });
    const mockComment = vi.fn().mockResolvedValue({ data: { id: 3 } });

    const mockOctokit: MinimalOctokit = {
      rest: {
        issues: {
          listForRepo: mockList,
          create: mockCreate,
          update: mockUpdate,
          createComment: mockComment,
        },
      },
    };

    const result = await manageGitHubFreshnessIssue(
      mockOctokit,
      { repo: { owner: 'Vinod-Nex', repo: 'sellercalchub' } },
      audit
    );

    expect(result.action).toBe('closed');
    expect(result.issueNumber).toBe(77);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 77,
        state: 'closed',
      })
    );
  });

  it('sorts multiple stale fee files by oldest verified date first', () => {
    fs.writeFileSync(
      path.join(tempDir, 'platform-35-days.json'),
      JSON.stringify({
        platform: 'p35',
        platform_name: 'Platform 35',
        verified_on: '2026-10-18', // 35 days ago
        source_url: 'https://p35.com',
      })
    );
    fs.writeFileSync(
      path.join(tempDir, 'platform-60-days.json'),
      JSON.stringify({
        platform: 'p60',
        platform_name: 'Platform 60',
        verified_on: '2026-09-23', // 60 days ago
        source_url: 'https://p60.com',
      })
    );

    const audit = runFreshnessAudit(tempDir, 30, '2026-11-22');
    expect(audit.staleCount).toBe(2);
    expect(audit.staleItems[0].platform).toBe('p60'); // Oldest first (60 days)
    expect(audit.staleItems[1].platform).toBe('p35'); // 35 days
  });
});
