#!/usr/bin/env node

/**
 * set-admin.mjs — Interactive CLI for managing Firebase Auth admin roles.
 *
 * Usage:
 *   node set-admin.mjs --key-file=path/to/service-account-key.json
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node set-admin.mjs
 *   make set-admin  (after placing key file)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import inquirer from 'inquirer';

// ── Parse CLI args ──────────────────────────────────────────────────────

function parseKeyFilePath() {
  const arg = process.argv.find((a) => a.startsWith('--key-file='));
  if (arg) return resolve(arg.split('=')[1]);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  return null;
}

// ── Initialize Firebase Admin ───────────────────────────────────────────

function initFirebase() {
  const keyFilePath = parseKeyFilePath();

  if (!keyFilePath) {
    console.error('\n  ERROR: No service account key provided.\n');
    console.error('  Provide a key using one of these methods:\n');
    console.error('    1. node set-admin.mjs --key-file=path/to/key.json');
    console.error('    2. export GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json\n');
    console.error('  To get a key:');
    console.error('    1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('    2. Click "Generate new private key"');
    console.error('    3. Save the JSON file (do NOT commit it to git)\n');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(keyFilePath, 'utf-8'));
  } catch (err) {
    console.error(`\n  ERROR: Could not read key file: ${keyFilePath}`);
    console.error(`  ${err.message}\n`);
    process.exit(1);
  }

  initializeApp({ credential: cert(serviceAccount) });
  console.log(`\n  Firebase project: ${serviceAccount.project_id}`);
  return getAuth();
}

// ── List all users (with pagination) ────────────────────────────────────

async function listAllUsers(auth) {
  const users = [];
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  return users;
}

// ── Format user for display ─────────────────────────────────────────────

function getRole(user) {
  return user.customClaims?.role || 'user';
}

function getProvider(user) {
  if (!user.providerData || user.providerData.length === 0) return 'email';
  const id = user.providerData[0].providerId;
  if (id === 'google.com') return 'google';
  if (id === 'apple.com') return 'apple';
  if (id === 'facebook.com') return 'facebook';
  if (id === 'password') return 'email';
  return id;
}

function formatUserLine(user) {
  const email = (user.email || '(no email)').padEnd(35);
  const name = (user.displayName || '—').padEnd(20);
  const role = getRole(user).padEnd(8);
  const provider = getProvider(user);
  return `${email} ${name} ${role} ${provider}`;
}

// ── Actions ─────────────────────────────────────────────────────────────

async function viewUsers(users) {
  console.log('');
  const header = 'EMAIL'.padEnd(35) + ' ' + 'NAME'.padEnd(20) + ' ' + 'ROLE'.padEnd(8) + ' PROVIDER';
  console.log(`  ${header}`);
  console.log(`  ${'─'.repeat(header.length)}`);
  for (const u of users) {
    console.log(`  ${formatUserLine(u)}`);
  }
  console.log(`\n  Total: ${users.length} user(s)\n`);
}

async function grantAdmin(auth, users) {
  const nonAdmins = users.filter((u) => getRole(u) !== 'admin');
  if (nonAdmins.length === 0) {
    console.log('\n  All users are already admins.\n');
    return;
  }

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select users to grant admin role:',
      choices: nonAdmins.map((u) => ({
        name: `${u.email || u.uid} (${u.displayName || '—'})`,
        value: u.uid,
      })),
    },
  ]);

  if (selected.length === 0) {
    console.log('  No users selected.\n');
    return;
  }

  for (const uid of selected) {
    const user = users.find((u) => u.uid === uid);
    const existing = user.customClaims || {};
    await auth.setCustomUserClaims(uid, { ...existing, role: 'admin' });
    console.log(`  ✓ Granted admin to ${user.email || uid}`);
  }

  console.log(`\n  Note: Users must sign out and back in (or wait up to 1 hour)`);
  console.log('  for the new role to take effect.\n');
}

async function revokeAdmin(auth, users) {
  const admins = users.filter((u) => getRole(u) === 'admin');
  if (admins.length === 0) {
    console.log('\n  No admins found.\n');
    return;
  }

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select admins to demote to regular user:',
      choices: admins.map((u) => ({
        name: `${u.email || u.uid} (${u.displayName || '—'})`,
        value: u.uid,
      })),
    },
  ]);

  if (selected.length === 0) {
    console.log('  No users selected.\n');
    return;
  }

  for (const uid of selected) {
    const user = users.find((u) => u.uid === uid);
    const existing = user.customClaims || {};
    await auth.setCustomUserClaims(uid, { ...existing, role: 'user' });
    console.log(`  ✓ Revoked admin from ${user.email || uid}`);
  }

  console.log(`\n  Note: Users must sign out and back in (or wait up to 1 hour)`);
  console.log('  for the role change to take effect.\n');
}

// ── Main loop ───────────────────────────────────────────────────────────

async function main() {
  const auth = initFirebase();

  let running = true;
  while (running) {
    const users = await listAllUsers(auth);

    const adminCount = users.filter((u) => getRole(u) === 'admin').length;
    console.log(`  ${users.length} user(s), ${adminCount} admin(s)\n`);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View all users', value: 'view' },
          { name: 'Grant admin role', value: 'grant' },
          { name: 'Revoke admin role', value: 'revoke' },
          { name: 'Exit', value: 'exit' },
        ],
      },
    ]);

    switch (action) {
      case 'view':
        await viewUsers(users);
        break;
      case 'grant':
        await grantAdmin(auth, users);
        break;
      case 'revoke':
        await revokeAdmin(auth, users);
        break;
      case 'exit':
        running = false;
        break;
    }
  }

  console.log('  Bye!\n');
}

main().catch((err) => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
