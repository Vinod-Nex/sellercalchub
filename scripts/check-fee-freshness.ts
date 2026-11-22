import fs from 'fs';
import path from 'path';

export interface FeeDataRecord {
  platform: string;
  platform_name: string;
  verified_on: string;
  source_url: string;
  effective_from?: string;
  notes?: string;
}

export interface StaleAuditItem {
  file: string;
  platform: string;
  platformName: string;
  verifiedOn: string;
  daysElapsed: number;
  sourceUrl: string;
  isStale: boolean;
}

export interface FreshnessAuditResult {
  totalFiles: number;
  staleCount: number;
  freshCount: number;
  maxAgeDays: number;
  referenceDate: string;
  staleItems: StaleAuditItem[];
  freshItems: StaleAuditItem[];
  markdownIssueTitle: string;
  markdownIssueBody: string;
}

export interface MinimalOctokit {
  rest: {
    issues: {
      listForRepo: (params: {
        owner: string;
        repo: string;
        state?: 'open' | 'closed' | 'all';
        labels?: string;
      }) => Promise<{ data: { number: number; title: string; html_url?: string }[] }>;
      create: (params: {
        owner: string;
        repo: string;
        title: string;
        body: string;
        labels?: string[];
      }) => Promise<{ data: { number: number; html_url?: string } }>;
      update: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        title?: string;
        body?: string;
        state?: 'open' | 'closed';
      }) => Promise<{ data: { number: number } }>;
      createComment: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        body: string;
      }) => Promise<{ data: { id: number } }>;
    };
  };
}

/**
 * Creates, updates, or closes a GitHub Issue for fee freshness based on audit results.
 */
export async function manageGitHubFreshnessIssue(
  octokit: MinimalOctokit,
  context: { repo: { owner: string; repo: string } },
  report: FreshnessAuditResult
): Promise<{ action: 'created' | 'updated' | 'closed' | 'none'; issueNumber?: number }> {
  const { owner, repo } = context.repo;

  // Search existing open fee-freshness issues
  const openIssues = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'fee-freshness',
  });

  if (report.staleCount > 0) {
    if (openIssues.data.length > 0) {
      const existing = openIssues.data[0];
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: existing.number,
        title: report.markdownIssueTitle,
        body: report.markdownIssueBody,
      });
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: existing.number,
        body: `🔄 **Fee Freshness Audit Updated:** ${report.staleCount} fee schedule(s) require reverification as of ${report.referenceDate}.`,
      });
      return { action: 'updated', issueNumber: existing.number };
    } else {
      const created = await octokit.rest.issues.create({
        owner,
        repo,
        title: report.markdownIssueTitle,
        body: report.markdownIssueBody,
        labels: ['fee-freshness', 'automated-audit', 'priority-medium'],
      });
      return { action: 'created', issueNumber: created.data.number };
    }
  } else {
    // If all are fresh, close any existing open freshness issue
    if (openIssues.data.length > 0) {
      const existing = openIssues.data[0];
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: existing.number,
        body: '✅ **All marketplace fee schedules have been verified and updated!** Closing this audit issue.',
      });
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: existing.number,
        state: 'closed',
      });
      return { action: 'closed', issueNumber: existing.number };
    }
    return { action: 'none' };
  }
}

export function runFreshnessAudit(
  directory: string = path.resolve(process.cwd(), 'src/data/fees'),
  maxAgeDays: number = 30,
  referenceDateIso?: string
): FreshnessAuditResult {
  const now = referenceDateIso ? new Date(referenceDateIso) : new Date();
  const files = fs.readdirSync(directory).filter((f) => f.endsWith('.json'));

  const staleItems: StaleAuditItem[] = [];
  const freshItems: StaleAuditItem[] = [];

  for (const filename of files) {
    const fullPath = path.join(directory, filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content) as FeeDataRecord;

    const verifiedDate = new Date(data.verified_on);
    const diffMs = now.getTime() - verifiedDate.getTime();
    const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isStale = daysElapsed > maxAgeDays;

    const item: StaleAuditItem = {
      file: filename,
      platform: data.platform || filename.replace('.json', ''),
      platformName: data.platform_name || data.platform || filename,
      verifiedOn: data.verified_on,
      daysElapsed,
      sourceUrl: data.source_url,
      isStale,
    };

    if (isStale) {
      staleItems.push(item);
    } else {
      freshItems.push(item);
    }
  }

  // Sort stale items by oldest verified date first
  staleItems.sort((a, b) => b.daysElapsed - a.daysElapsed);

  const staleCount = staleItems.length;
  const title = `⚠️ Monthly Audit: ${staleCount} marketplace fee schedule(s) require reverification (>30 days stale)`;

  let body = `## 🕒 Monthly Fee Freshness Audit Report\n\n`;
  body += `**Audit Reference Date:** ${now.toISOString().split('T')[0]}\n`;
  body += `**Freshness Threshold:** ${maxAgeDays} days\n`;
  body += `**Total Rate Files Scanned:** ${files.length}\n`;
  body += `**Stale Files Requiring Reverification:** ${staleCount}\n\n`;

  if (staleCount > 0) {
    body += `### 📋 Stale Fee Files Requiring Audit\n\n`;
    body += `| Marketplace | Data File | Last Verified On | Age (Days) | Official Documentation Link |\n`;
    body += `| :--- | :--- | :--- | :--- | :--- |\n`;
    for (const item of staleItems) {
      body += `| **${item.platformName}** | \`src/data/fees/${item.file}\` | ${item.verifiedOn} | **${item.daysElapsed} days** | [Official Fee Schedule](${item.sourceUrl}) |\n`;
    }

    body += `\n### ✅ Review & Update Checklist\n\n`;
    body += `Follow the mandatory rate-verification process from \`AGENTS.md\` and \`/methodology/\`:\n\n`;
    for (const item of staleItems) {
      body += `- [ ] **${item.platformName}**: Review [Official Documentation](${item.sourceUrl}).\n`;
      body += `  - If rates are unchanged: update \`"verified_on": "${now.toISOString().split('T')[0]}"\` in \`src/data/fees/${item.file}\`.\n`;
      body += `  - If rates changed: update percentage commission, flat fee, notes, and \`verified_on\` date.\n`;
    }
    body += `\n- [ ] Run \`npm run verify:fees && npm test && npm run check:links\`\n`;
    body += `- [ ] Submit Pull Request referencing this issue to close it.\n`;
  } else {
    body += `🎉 **All marketplace fee schedules are up-to-date** within the ${maxAgeDays}-day verification policy.\n`;
  }

  return {
    totalFiles: files.length,
    staleCount,
    freshCount: freshItems.length,
    maxAgeDays,
    referenceDate: now.toISOString().split('T')[0],
    staleItems,
    freshItems,
    markdownIssueTitle: title,
    markdownIssueBody: body,
  };
}

// CLI Execution
if (process.argv[1] && process.argv[1].endsWith('check-fee-freshness.ts')) {
  const args = process.argv.slice(2);
  let targetDir = path.resolve(process.cwd(), 'src/data/fees');
  let maxAge = 30;
  let customDate: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--dir=')) {
      targetDir = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg.startsWith('--days=')) {
      maxAge = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--now=')) {
      customDate = arg.split('=')[1];
    }
  }

  const result = runFreshnessAudit(targetDir, maxAge, customDate);

  console.log(`\n========================================`);
  console.log(`FEE FRESHNESS AUDIT (${result.referenceDate})`);
  console.log(`Total files: ${result.totalFiles} | Stale: ${result.staleCount} | Fresh: ${result.freshCount}`);
  console.log(`========================================\n`);

  if (result.staleCount > 0) {
    console.warn(result.markdownIssueTitle);
    for (const item of result.staleItems) {
      console.warn(`  - [STALE] ${item.platformName} (${item.file}): last verified ${item.verifiedOn} (${item.daysElapsed} days ago)`);
    }

    // Save report for GitHub Actions consumption
    const reportPath = path.resolve(process.cwd(), 'fee-freshness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`\nSaved freshness report to: ${reportPath}`);

    // If running in GitHub Actions, export output variables
    if (process.env.GITHUB_OUTPUT) {
      const outputFile = process.env.GITHUB_OUTPUT;
      fs.appendFileSync(outputFile, `has_stale=true\n`);
      fs.appendFileSync(outputFile, `stale_count=${result.staleCount}\n`);
      fs.appendFileSync(outputFile, `issue_title=${result.markdownIssueTitle}\n`);
    }

    // Exit with code 1 if stale files are present
    process.exit(1);
  } else {
    console.log('✅ All fee data files verified within the last 30 days.');
    if (process.env.GITHUB_OUTPUT) {
      const outputFile = process.env.GITHUB_OUTPUT;
      fs.appendFileSync(outputFile, `has_stale=false\n`);
      fs.appendFileSync(outputFile, `stale_count=0\n`);
    }
    process.exit(0);
  }
}
