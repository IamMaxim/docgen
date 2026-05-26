#!/usr/bin/env node
import { main } from '../lib/index.mjs';

main(process.argv.slice(2)).catch((err) => {
	if (err && err.code === 'CANCELLED') {
		console.log('\nAborted.');
		process.exit(1);
	}
	console.error(err);
	process.exit(1);
});
