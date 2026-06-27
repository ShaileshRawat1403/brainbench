import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const REPO_ROOT = path.resolve(__dirname, '../../../');
const DIGEST_SCRIPT = path.join(REPO_ROOT, 'systems/toolsmith/scripts/telegram-digest.ts');

function sanitizeText(text: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token && token.trim().length > 5 && token !== 'your_telegram_bot_token_here') {
    const escapedToken = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    return text.replace(regex, '[REDACTED_TOKEN]');
  }
  return text;
}

async function safeFetch(url: string, options?: RequestInit, maxAttempts = 3, initialDelay = 1000): Promise<Response> {
  let attempt = 1;
  let delay = initialDelay;
  
  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.status >= 500 && attempt < maxAttempts) {
        throw new Error(`HTTP status ${res.status}`);
      }
      return res;
    } catch (e: any) {
      const sanitizedErr = sanitizeText(e.message || String(e));
      if (attempt >= maxAttempts) {
        throw new Error(`SafeFetch failed after ${maxAttempts} attempts: ${sanitizedErr}`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
      delay *= 2;
    }
  }
}

function executeDigest(command: string): { code: number; stdout: string; stderr: string } {
  // Use safe spawning with argument arrays to prevent injection
  const result = spawnSync('bun', ['run', DIGEST_SCRIPT, '--command', command], {
    encoding: 'utf-8'
  });
  return {
    code: result.status ?? 1,
    stdout: sanitizeText(result.stdout ?? ''),
    stderr: sanitizeText(result.stderr ?? '')
  };
}

function clampMessage(text: string): string {
  const maxLength = 4000;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '\n\n... (message truncated)\nOpen dashboard/index.md for full details.';
  }
  return text;
}

function getKolkataTime(simulatedDate?: Date): { hour: number; minute: number; weekdayStr: string; dateString: string } {
  const targetDate = simulatedDate || new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(targetDate);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);
  
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' });
  const weekdayStr = weekdayFormatter.format(targetDate);
  
  const dateString = `${partMap.year}-${partMap.month}-${partMap.day}`;
  
  return { hour, minute, weekdayStr, dateString };
}

function shouldFireDaily(hour: number, minute: number, dateString: string, lastSentDailyDate: string): boolean {
  return hour === 18 && minute === 0 && dateString !== lastSentDailyDate;
}

function shouldFireWeekly(hour: number, minute: number, weekdayStr: string, dateString: string, lastSentWeeklyDate: string): boolean {
  return hour === 18 && minute === 0 && weekdayStr === 'Sunday' && dateString !== lastSentWeeklyDate;
}

function validateStartupConfig(botToken?: string, allowedChatIdStr?: string): { valid: boolean; error?: string } {
  if (!botToken || botToken.trim().length === 0) {
    return { valid: false, error: 'TELEGRAM_BOT_TOKEN is missing.' };
  }
  if (botToken === 'your_telegram_bot_token_here' || botToken.includes('PLACEHOLDER')) {
    return { valid: false, error: 'TELEGRAM_BOT_TOKEN is a placeholder.' };
  }
  if (botToken.length < 10) {
    return { valid: false, error: 'TELEGRAM_BOT_TOKEN is too short.' };
  }
  if (!allowedChatIdStr || allowedChatIdStr.trim().length === 0) {
    return { valid: false, error: 'TELEGRAM_ALLOWED_CHAT_ID is missing.' };
  }
  if (allowedChatIdStr === 'your_telegram_chat_id_here') {
    return { valid: false, error: 'TELEGRAM_ALLOWED_CHAT_ID is a placeholder.' };
  }
  const chatId = parseInt(allowedChatIdStr, 10);
  if (isNaN(chatId)) {
    return { valid: false, error: 'TELEGRAM_ALLOWED_CHAT_ID is not a valid number.' };
  }
  return { valid: true };
}

function startScheduler(botToken: string, allowedChatId: number) {
  let lastDailySentDate = '';
  let lastWeeklySentDate = '';
  
  console.log('[Telegram Bot] Starting background scheduler check (Asia/Kolkata, dedupe: process-local)...');
  
  setInterval(async () => {
    try {
      const nowKolkata = getKolkataTime();
      if (shouldFireDaily(nowKolkata.hour, nowKolkata.minute, nowKolkata.dateString, lastDailySentDate)) {
        lastDailySentDate = nowKolkata.dateString;
        console.log(`[Scheduler] Firing scheduled daily status digest...`);
        const digestRes = executeDigest('/status');
        const responseText = digestRes.stdout || digestRes.stderr || 'No response output generated.';
        const clamped = clampMessage(responseText);
        
        const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
        try {
          await safeFetch(`${baseUrl}/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: allowedChatId,
              text: clamped
            })
          });
        } catch (err: any) {
          console.error('[Scheduler] Failed to send scheduled daily digest after retries:', sanitizeText(err.message));
        }
      }
      
      if (shouldFireWeekly(nowKolkata.hour, nowKolkata.minute, nowKolkata.weekdayStr, nowKolkata.dateString, lastWeeklySentDate)) {
        lastWeeklySentDate = nowKolkata.dateString;
        console.log(`[Scheduler] Firing scheduled weekly status digest...`);
        const digestRes = executeDigest('/weekly');
        const responseText = digestRes.stdout || digestRes.stderr || 'No response output generated.';
        const clamped = clampMessage(responseText);
        
        const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
        try {
          await safeFetch(`${baseUrl}/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: allowedChatId,
              text: clamped
            })
          });
        } catch (err: any) {
          console.error('[Scheduler] Failed to send scheduled weekly digest after retries:', sanitizeText(err.message));
        }
      }
    } catch (e: any) {
      console.error('[Scheduler] Exception in background scheduler tick:', sanitizeText(e.message || String(e)));
    }
  }, 10000); // Check every 10 seconds
}

async function runBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatIdStr = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  
  const validation = validateStartupConfig(botToken, allowedChatIdStr);
  if (!validation.valid) {
    console.error(`Error: Configuration validation failed - ${validation.error}`);
    process.exit(1);
  }

  const allowedChatId = parseInt(allowedChatIdStr!, 10);

  // Webhook state cleanup on startup
  console.log('[Telegram Bot] Starting up. Cleaning up webhook state...');
  try {
    const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    const cleanWebhook = await safeFetch(`${baseUrl}/bot${botToken}/deleteWebhook?drop_pending_updates=false`);
    const cleanRes = await cleanWebhook.json();
    console.log('[Telegram Bot] deleteWebhook result:', cleanRes.ok ? 'success' : 'failed');
  } catch (e: any) {
    console.error('[Telegram Bot] Failed to call deleteWebhook during startup:', sanitizeText(e.message || String(e)));
  }

  // Start background schedule triggers
  startScheduler(botToken!, allowedChatId);

  console.log('[Telegram Bot] Starting getUpdates long polling loop...');

  let offset = 0;
  
  while (true) {
    try {
      const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
      const url = `${baseUrl}/bot${botToken}/getUpdates?offset=${offset}&timeout=30`;
      const res = await safeFetch(url);
      const data = await res.json();
      
      if (!data.ok) {
        console.error('[Telegram Bot] getUpdates error response from API.');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const updates = data.result || [];
      for (const update of updates) {
        // Advance offset to prevent duplicate processing
        offset = update.update_id + 1;
        
        const message = update.message;
        if (!message || !message.text) continue;
        
        const chatId = message.chat.id;
        const text = message.text.trim();
        
        // Chat whitelisting security check
        if (chatId !== allowedChatId) {
          console.warn(`[Telegram Bot] Ignored message from unauthorized chat ID: ${chatId}`);
          const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
          try {
            await safeFetch(`${baseUrl}/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: 'Access Denied.'
              })
            });
          } catch (err) {}
          continue;
        }

        // Process message text
        if (text.startsWith('/')) {
          const parts = text.split(/\s+/);
          const command = parts[0];
          
          const allowedCommands = ['/status', '/weekly', '/handoffs', '/blockers', '/evidence', '/decisions'];
          const rejectedCommands = ['/mark_done', '/approve', '/open_pr', '/merge', '/edit_state'];
          
          let responseText = '';
          if (allowedCommands.includes(command) || rejectedCommands.includes(command)) {
            // Spawn digest command safely
            const digestRes = executeDigest(text);
            responseText = digestRes.stdout || digestRes.stderr || 'No response output generated.';
          } else {
            // Help/Unknown command handling
            responseText = 'Supported read-only commands: /status, /weekly, /handoffs, /blockers, /evidence, /decisions.';
          }

          // Reply via sendMessage
          const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
          try {
            const clamped = clampMessage(responseText);
            await safeFetch(`${baseUrl}/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: allowedChatId,
                text: clamped
              })
            });
          } catch (sendErr: any) {
            console.error('[Telegram Bot] Failed to send message reply:', sanitizeText(sendErr.message || String(sendErr)));
          }
        }
      }
    } catch (e: any) {
      console.error('[Telegram Bot] Exception in long polling loop:', sanitizeText(e.message || String(e)));
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const sendDaily = argv.includes('--send-daily');
  const sendWeekly = argv.includes('--send-weekly');

  if (sendDaily || sendWeekly) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const allowedChatIdStr = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    
    const validation = validateStartupConfig(botToken, allowedChatIdStr);
    if (!validation.valid) {
      console.error(`Error: Configuration validation failed - ${validation.error}`);
      process.exit(1);
    }
    
    const allowedChatId = parseInt(allowedChatIdStr!, 10);
    const command = sendDaily ? '/status' : '/weekly';
    console.log(`[Telegram Bot] Sending single update for ${command}...`);
    
    const digestRes = executeDigest(command);
    const responseText = digestRes.stdout || digestRes.stderr || 'No response output generated.';
    const clamped = clampMessage(responseText);
    
    const baseUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
    try {
      const pushRes = await safeFetch(`${baseUrl}/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: allowedChatId,
          text: clamped
        })
      });
      const pushData = await pushRes.json();
      console.log('[Telegram Bot] Push result:', pushData.ok ? 'success' : 'failed');
      process.exit(pushData.ok ? 0 : 1);
    } catch (e: any) {
      console.error('[Telegram Bot] Failed to execute push send:', sanitizeText(e.message || String(e)));
      process.exit(1);
    }
  } else {
    // Run updates long polling loop
    await runBot();
  }
}

export {
  runBot,
  executeDigest,
  clampMessage,
  main,
  getKolkataTime,
  shouldFireDaily,
  shouldFireWeekly,
  sanitizeText,
  safeFetch,
  validateStartupConfig
};

if (import.meta.main) {
  main();
}
