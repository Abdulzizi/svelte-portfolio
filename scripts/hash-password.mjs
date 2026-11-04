#!/usr/bin/env node
// Generate an argon2 hash for ADMIN_PASSWORD_HASH. Usage:
//   npm run hash -- 'the password'        (argv)
//   echo 'the password' | npm run hash    (stdin)
// Prints ONLY the hash to stdout. Plaintext is never logged.
import { hash } from '@node-rs/argon2';

async function readStdin() {
	if (process.stdin.isTTY) return '';
	const chunks = [];
	for await (const c of process.stdin) chunks.push(c);
	// Trim a single trailing newline from `echo`, keep the rest verbatim.
	return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

const password = process.argv[2] ?? (await readStdin());

if (!password) {
	process.stderr.write("usage: npm run hash -- '<password>'   (or pipe via stdin)\n");
	process.exit(1);
}

process.stdout.write((await hash(password)) + '\n');
