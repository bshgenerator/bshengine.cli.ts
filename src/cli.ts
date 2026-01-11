import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// cli commands
import { createPluginsCommand } from '@plugin/cli';
import { createDockerCommand } from '@docker/cli';

// Create CLI program with version and name 'bsh'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('bsh')
  .description('BSH Engine Manager - A CLI tool for managing BSH Engine')
  .version(packageJson.version);

// Add commands to main program
program.addCommand(createPluginsCommand());
program.addCommand(createDockerCommand());

program.parse();

