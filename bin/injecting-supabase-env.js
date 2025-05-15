#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Equivalent to `APPLICATION_ROOT_PATH=$(dirname $(dirname $(readlink -f $0)))`
const applicationRootPath = path.resolve(__dirname, '..');
const originalCwd = process.cwd();

// Get the command and arguments to run (e.g., "vite", "build")
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: No command provided to execute.');
  process.exit(1);
}
const commandToRun = args[0];
const commandArgs = args.slice(1);

let supabaseEnvVars = {};

try {
  console.log('Retrieving Supabase environment variables...');
  // Equivalent to `cd $APPLICATION_ROOT_PATH` for the supabase command
  const supabaseStatusOutput = execSync('npx --yes supabase status --output env', {
    cwd: applicationRootPath,
    encoding: 'utf-8',
  });

  supabaseStatusOutput.split('\n').forEach(line => {
    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        // Equivalent to `sed "s/^/SUPABASE_/"`
        supabaseEnvVars[`SUPABASE_${key.trim()}`] = value.trim();
      }
    }
  });
  console.log('Supabase environment variables retrieved.');
} catch (error) {
  console.warn('Warning: Failed to retrieve Supabase environment variables.');
  console.warn(error.message);
  // Optionally, decide if this is a fatal error or if the script should continue
  // For now, we'll let it continue, and Vite might pick up .env file values.
}

// Prepare environment for the child process
const childEnv = { ...process.env };

// Set the SUPABASE_ prefixed variables
for (const key in supabaseEnvVars) {
  childEnv[key] = supabaseEnvVars[key];
}

// Set VITE_ specific variables, taking from the SUPABASE_ prefixed ones
if (childEnv['SUPABASE_API_URL']) {
  childEnv['VITE_SUPABASE_URL'] = childEnv['SUPABASE_API_URL'];
} else {
  console.warn('Warning: SUPABASE_API_URL not found from supabase status. VITE_SUPABASE_URL may not be set correctly by this script.');
}

if (childEnv['SUPABASE_ANON_KEY']) {
  childEnv['VITE_SUPABASE_ANON_KEY'] = childEnv['SUPABASE_ANON_KEY'];
} else {
  console.warn('Warning: SUPABASE_ANON_KEY not found from supabase status. VITE_SUPABASE_ANON_KEY may not be set correctly by this script.');
}

console.log(`Running command: ${commandToRun} ${commandArgs.join(' ')}`);

// Run the original command (e.g., vite)
// The command should run in the original working directory
const child = spawn(commandToRun, commandArgs, {
  env: childEnv,
  stdio: 'inherit',
  cwd: originalCwd, // Ensure command runs in the directory where `npm run dev` was invoked
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else if (signal !== null) {
    console.log(`Process killed with signal: ${signal}`);
    process.exit(1);
  }
});

child.on('error', (err) => {
  console.error(`Failed to start subprocess. ${err}`);
  process.exit(1);
});
