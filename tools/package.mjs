
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

import { exit } from 'process';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';

function getArgs() {
	const argv = yargs(hideBin(process.argv))
		.version(false)
		.option('version', { demand: true, alias: 'v', type: 'string', default: '0.0.0', description: 'Version' })
		.option('output', { demand: false, alias: 'o', default: 'dist', description: 'Output directory' })
		.option('root', { demand: false, alias: 'r', default: '.', description: 'Root directory' })
		.argv;

	return argv;
}

function generatePackage() {
	const packageMetadata = (version, dependencies) => ({
		name: '@origin-yaropolk/reactive-state',
		version,
		author: 'origin-yaropolk',
		description: 'Makes state reactive',
		license: 'MIT',
		keywords: ['state', 'reactive', 'rxjs', 'observable'],
		repository: {
			type: 'git',
			url: 'https://github.com/origin-yaropolk/reactive-state',
		},
		exports: './index.js',
		dependencies,
	});

	const packageJson = packageMetadata(getArgs().version, JSON.parse(readFileSync(join(getArgs().root, 'package.json'))).dependencies);

	writeFileSync(join(getArgs().output, 'package.json'), JSON.stringify(packageJson, null, '\t'));
}

function main() {
	try {
		generatePackage();
		copyFileSync(join(getArgs().root, 'LICENSE'), join(getArgs().output, 'LICENSE'));
		copyFileSync(join(getArgs().root, 'README.md'), join(getArgs().output, 'README.md'));
		console.log('Successful compiled.');
	} catch (err) {
		console.error('FAIL:');
		console.error(err);
		exit(1);
	}
}

main();
