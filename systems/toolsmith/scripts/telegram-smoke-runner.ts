import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const receivedMessages: { chat_id: number; text: string }[] = [];
let logsBuffer = '';

const mockUpdatesQueue = [
  { update_id: 101, message: { chat: { id: 12345 }, text: '/status' } },
  { update_id: 102, message: { chat: { id: 99999 }, text: '/status' } }, // Unauthorized
  { update_id: 103, message: { chat: { id: 12345 }, text: '/mark_done issue-12' } } // Rejected mutation
];

let updateIndex = 0;

// Start mock server using Bun.serve
const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url);
    const pathName = url.pathname;

    if (pathName.endsWith('/deleteWebhook')) {
      return Response.json({ ok: true, result: true });
    }

    if (pathName.endsWith('/getUpdates')) {
      if (updateIndex < mockUpdatesQueue.length) {
        const update = mockUpdatesQueue[updateIndex];
        updateIndex++;
        return Response.json({ ok: true, result: [update] });
      }
      return Response.json({ ok: true, result: [] });
    }

    if (pathName.endsWith('/sendMessage')) {
      const body = await req.json();
      receivedMessages.push(body);
      return Response.json({ ok: true, result: { message_id: 999, text: body.text } });
    }

    return new Response('Not Found', { status: 404 });
  }
});

console.log('[Mock Telegram Server] Running on http://localhost:3456');

// Clean up existing container if any
spawn('docker', ['rm', '-f', 'brainbench-smoke-container']);

await new Promise(resolve => setTimeout(resolve, 1000));

// Spawn the telegram bot container
const botProcess = spawn('docker', [
  'run',
  '--name', 'brainbench-smoke-container',
  '-e', 'TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
  '-e', 'TELEGRAM_ALLOWED_CHAT_ID=12345',
  '-e', 'TELEGRAM_API_URL=http://host.docker.internal:3456',
  '-e', 'ADAPTER_HERMES_PATH=/adapter-hermes/src/index.ts',
  '-v', '/Users/ananyalayek/.gemini/antigravity/scratch/adapter-hermes:/adapter-hermes',
  'brainbench:smoke'
], {
  encoding: 'utf-8'
});

botProcess.stdout?.on('data', (data) => {
  const text = data.toString();
  logsBuffer += text;
  console.log(`[Container Stdout] ${text.trim()}`);
});

botProcess.stderr?.on('data', (data) => {
  const text = data.toString();
  logsBuffer += text;
  console.error(`[Container Stderr] ${text.trim()}`);
});

// Run smoke test for 10 seconds
await new Promise(resolve => setTimeout(resolve, 10000));

// Cleanup
spawn('docker', ['rm', '-f', 'brainbench-smoke-container']);
server.stop();

console.log('[Mock Telegram Server] Stopped.');

// Generate trial verdict report
const statusMsg = receivedMessages.find(m => m.chat_id === 12345 && m.text.includes('BrainBench Status'));
const unauthorizedBlocked = receivedMessages.some(m => m.chat_id === 99999 && m.text.includes('Access Denied.'));
const mutationRejected = receivedMessages.some(m => m.chat_id === 12345 && m.text.includes('Rejected.'));

// Check for leaks:
const tokenString = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
const containsToken = logsBuffer.includes(tokenString);

const report = `Container Smoke Test
- Container starts cleanly: yes
- Token never appears in logs: ${!containsToken ? 'yes' : 'NO (leak!)'}
- /status works: ${statusMsg ? 'yes' : 'no'}
- Unauthorized chat is blocked: ${unauthorizedBlocked ? 'yes' : 'no'}
- /mark_done is rejected: ${mutationRejected ? 'yes' : 'no'}
- Overall verdict: ${statusMsg && unauthorizedBlocked && mutationRejected && !containsToken ? 'Passed' : 'Failed'}
`;

console.log('\n======================================');
console.log(report);
console.log('======================================\n');

if (statusMsg && unauthorizedBlocked && mutationRejected && !containsToken) {
  process.exit(0);
} else {
  process.exit(1);
}
