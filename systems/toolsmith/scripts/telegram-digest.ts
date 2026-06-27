import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
import { execSync } from 'child_process';

const REPO_ROOT = path.resolve(__dirname, '../../../');

interface IntentDetails {
  intent: string;
  requested_action: string;
  target_system: string;
}

const COMMAND_MAP: Record<string, IntentDetails> = {
  '/status': { intent: 'status_check', requested_action: 'summarize', target_system: 'brainbench' },
  '/weekly': { intent: 'weekly_briefing', requested_action: 'summarize', target_system: 'weekly_report' },
  '/handoffs': { intent: 'handoffs_lookup', requested_action: 'observe', target_system: 'repo_handoffs' },
  '/blockers': { intent: 'blockers_lookup', requested_action: 'observe', target_system: 'dashboard' },
  '/evidence': { intent: 'evidence_lookup', requested_action: 'observe', target_system: 'dashboard' },
  '/decisions': { intent: 'decisions_lookup', requested_action: 'observe', target_system: 'dashboard' },
  '/approve': { intent: 'approve_dec', requested_action: 'approve', target_system: 'brainbench' },
  '/open_pr': { intent: 'open_pr_req', requested_action: 'open_pr', target_system: 'brainbench' },
  '/merge': { intent: 'merge_pr_req', requested_action: 'merge_pr', target_system: 'brainbench' },
  '/edit_state': { intent: 'edit_state_req', requested_action: 'change_state', target_system: 'brainbench' },
  '/mark_done': { intent: 'mark_done_req', requested_action: 'mutate', target_system: 'brainbench' }
};

// Parse command line arguments
function parseCommandArg(): string {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--command') {
      return argv[i + 1] || '';
    }
  }
  return '';
}

function handleStatus() {
  const indexPath = path.resolve(REPO_ROOT, 'dashboard/index.md');
  if (!fs.existsSync(indexPath)) {
    console.log('Dashboard index not found.');
    return;
  }
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  const snapshotPart = indexContent.split('<!-- brainbench:generated:visual-snapshot:start -->')[1]
    ?.split('<!-- brainbench:generated:visual-snapshot:end -->')[0] || '';
  
  const lines = snapshotPart.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  let sprint = 'Unknown';
  let humanReview = '0';
  let evidenceGaps = '0';
  let decisionGaps = '0';
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('Active Sprint:')) {
      sprint = l.replace(/^>\s*###\s*Active Sprint:\s*/, '').trim();
      if (lines[i+1] && lines[i+1].includes('Progress:')) {
        const progress = lines[i+1].replace(/^>\s*Progress:\s*/, '').trim().replace(/`/g, '');
        sprint += ` (${progress})`;
      }
    } else if (l.includes('Human Review:')) {
      humanReview = l.replace(/^>\s*###\s*Human Review:\s*/, '').trim();
    } else if (l.includes('Open Evidence Gaps:')) {
      evidenceGaps = l.replace(/^>\s*###\s*Open Evidence Gaps:\s*/, '').trim();
    } else if (l.includes('Open Decision Gaps:')) {
      decisionGaps = l.replace(/^>\s*###\s*Open Decision Gaps:\s*/, '').trim();
    }
  }

  console.log(`BrainBench Status\n`);
  console.log(`Sprint: ${sprint}`);
  console.log(`Human review: ${humanReview}`);
  console.log(`Evidence gaps: ${evidenceGaps}`);
  console.log(`Decision gaps: ${decisionGaps}\n`);
  
  console.log(`Needs attention:`);
  if (evidenceGaps !== '0' || decisionGaps !== '0' || humanReview !== '0') {
    if (evidenceGaps !== '0') console.log(`- Evidence gaps found`);
    if (decisionGaps !== '0') console.log(`- Decision gaps found`);
    if (humanReview !== '0') console.log(`- Human review items pending`);
  } else {
    console.log(`None`);
  }
  
  console.log(`\nLatest signal:`);
  console.log(`adapter-hermes registered and active.`);
}

function handleWeekly() {
  const filePath = path.resolve(REPO_ROOT, 'dashboard/weekly-report.md');
  if (!fs.existsSync(filePath)) {
    console.log('Weekly report not found.');
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const metricsPart = content.split('<!-- brainbench:generated:start -->')[1]
    ?.split('<!-- brainbench:generated:end -->')[0] || '';
  
  console.log(`BrainBench Weekly Brief:\n`);
  console.log(metricsPart.trim());
}

function handleHandoffs() {
  console.log('BrainBench Repo Handoffs Status:\n');
  
  const dailyDir = path.resolve(REPO_ROOT, 'bench/repo-handoffs/daily');
  if (fs.existsSync(dailyDir)) {
    const files = fs.readdirSync(dailyDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const raw = fs.readFileSync(path.join(dailyDir, file), 'utf-8');
        const parts = raw.split('---');
        if (parts.length >= 3) {
          const fm = parse(parts[1]);
          console.log(`- *${fm.repo_id}* (daily, ${fm.date}): status=\`${fm.status}\`, risk=\`${fm.risk_level}\`, scope=\`${fm.handoff_scope}\``);
        }
      }
    }
  }

  const weeklyDir = path.resolve(REPO_ROOT, 'bench/repo-handoffs/weekly');
  if (fs.existsSync(weeklyDir)) {
    const files = fs.readdirSync(weeklyDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const raw = fs.readFileSync(path.join(weeklyDir, file), 'utf-8');
        const parts = raw.split('---');
        if (parts.length >= 3) {
          const fm = parse(parts[1]);
          console.log(`- *${fm.repo_id}* (weekly, ${fm.week}): status=\`${fm.status}\`, risk=\`${fm.risk_level}\`, scope=\`${fm.handoff_scope}\``);
        }
      }
    }
  }
}

function handleBlockers() {
  console.log('BrainBench Active Blockers & Evidence Gaps:\n');
  
  const gapsPath = path.resolve(REPO_ROOT, 'dashboard/evidence-gaps.md');
  let hasGaps = false;
  if (fs.existsSync(gapsPath)) {
    const raw = fs.readFileSync(gapsPath, 'utf-8');
    const part = raw.split('<!-- brainbench:generated:start -->')[1]
      ?.split('<!-- brainbench:generated:end -->')[0] || '';
    
    const lines = part.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith('|') && !line.includes('Gap ID') && !line.includes('---|'));
    
    if (lines.length > 0) {
      hasGaps = true;
      console.log('Evidence Gaps:');
      for (const line of lines) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (cols.length >= 3) {
          console.log(`- *Issue ${cols[1]}*: ${cols[2]}`);
        }
      }
    }
  }

  if (!hasGaps) {
    console.log('No active blockers or evidence gaps detected.');
  }
}

function handleEvidence() {
  console.log('BrainBench Validation Evidence Index:\n');
  
  const indexPath = path.resolve(REPO_ROOT, 'bench/validation/evidence-index.md');
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const part = raw.split('<!-- brainbench:generated:start -->')[1]
      ?.split('<!-- brainbench:generated:end -->')[0] || '';
    
    const lines = part.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith('|') && !line.includes('Task') && !line.includes('---|'));
    
    for (const line of lines) {
      const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cols.length >= 3) {
        const taskText = cols[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const evidenceText = cols[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        console.log(`- ${taskText}: PR=${cols[1]} (${evidenceText})`);
      }
    }
  }
}

function handleDecisions() {
  console.log('BrainBench Active Decisions & Gaps:\n');
  
  const gapsPath = path.resolve(REPO_ROOT, 'dashboard/decision-gaps.md');
  let hasGaps = false;
  if (fs.existsSync(gapsPath)) {
    const raw = fs.readFileSync(gapsPath, 'utf-8');
    const part = raw.split('<!-- brainbench:generated:start -->')[1]
      ?.split('<!-- brainbench:generated:end -->')[0] || '';
    
    const lines = part.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith('|') && !line.includes('Gap ID') && !line.includes('---|'));
    
    if (lines.length > 0) {
      hasGaps = true;
      console.log('Decision Gaps:');
      for (const line of lines) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (cols.length >= 4) {
          console.log(`- *Theme ${cols[1]}*: ${cols[3]}`);
        }
      }
      console.log();
    }
  }
  
  if (!hasGaps) {
    console.log('Decision Gaps: None\n');
  }

  const decisionsDir = path.resolve(REPO_ROOT, 'brain/decisions');
  if (fs.existsSync(decisionsDir)) {
    console.log('Recent Decision Logs:');
    const files = fs.readdirSync(decisionsDir)
      .filter(file => file.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 5);
    
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(decisionsDir, file), 'utf-8');
        const parts = raw.split('---');
        if (parts.length >= 3) {
          const fm = parse(parts[1]);
          console.log(`- [Approved] ${fm.title} (${fm.date})`);
        }
      } catch (e) {}
    }
  }
}

function main() {
  const commandStr = parseCommandArg();
  if (!commandStr) {
    console.error('Error: --command <string> argument is required.');
    process.exit(1);
  }

  const parts = commandStr.trim().split(/\s+/);
  const baseCmd = parts[0];

  const mapped = COMMAND_MAP[baseCmd] || { intent: 'unknown_cmd', requested_action: 'unknown', target_system: 'brainbench' };

  const intentJson = {
    source: 'telegram',
    actor: 'shailesh',
    intent: mapped.intent,
    target_system: mapped.target_system,
    requested_action: mapped.requested_action,
    raw_message: commandStr
  };

  const tmpDir = path.resolve(REPO_ROOT, 'tmp/hermes-requests');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const safeCmdName = baseCmd.replace('/', '').replace('_', '-');
  const tmpIntentPath = path.join(tmpDir, `${safeCmdName}.json`);
  fs.writeFileSync(tmpIntentPath, JSON.stringify(intentJson, null, 2), 'utf-8');

  const adapterPath = '/Users/ananyalayek/.gemini/antigravity/scratch/adapter-hermes/src/index.ts';
  const requestOutputDir = path.resolve(REPO_ROOT, 'tmp/hermes-requests');
  const auditDir = path.resolve(REPO_ROOT, 'bench/agent-runs/hermes');

  let allowed = false;
  let governanceReason = '';
  let governanceFallback = '';

  try {
    execSync(
      `bun run ${adapterPath} --intent ${tmpIntentPath} --request-output-dir ${requestOutputDir} --audit-dir ${auditDir}`,
      { stdio: 'pipe', encoding: 'utf-8' }
    );
    allowed = true;
  } catch (e: any) {
    allowed = false;
    const requestYmlPath = path.join(requestOutputDir, `flowright-request-${safeCmdName}.yml`);
    if (fs.existsSync(requestYmlPath)) {
      try {
        const content = fs.readFileSync(requestYmlPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.startsWith('reason:')) {
            governanceReason = line.replace('reason:', '').trim();
          }
          if (line.startsWith('fallback:')) {
            governanceFallback = line.replace('fallback:', '').trim();
          }
        }
      } catch (err) {}
    }
  }

  if (!allowed) {
    if (mapped.requested_action === 'unknown') {
      console.log(`Unknown command. Supported read-only commands are /status, /weekly, /handoffs, /blockers, /evidence, /decisions.`);
    } else {
      console.log(`Rejected.`);
      console.log(`Reason: ${governanceReason || 'State mutation is not allowed in adapter-hermes V0.1.'}`);
      console.log(`Safe Fallback: ${governanceFallback || 'Draft a transition plan instead.'}`);
    }
    process.exit(1);
  }

  // Allowed read-only handler routing
  switch (baseCmd) {
    case '/status':
      handleStatus();
      break;
    case '/weekly':
      handleWeekly();
      break;
    case '/handoffs':
      handleHandoffs();
      break;
    case '/blockers':
      handleBlockers();
      break;
    case '/evidence':
      handleEvidence();
      break;
    case '/decisions':
      handleDecisions();
      break;
    default:
      console.log(`Unknown command. Supported read-only commands are /status, /weekly, /handoffs, /blockers, /evidence, /decisions.`);
      process.exit(1);
  }
}

main();
