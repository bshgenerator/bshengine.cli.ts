import { Command } from 'commander';
import { installPlugin } from '@plugin/api';
import type { BshEngineConfig } from '@plugin/types';
import { logger } from '@src/logger';

export type InstallCommandOptions = {
  host: string;
  apiKey: string;
  verbose?: boolean;
}

export function getBshEngineConfig(options: InstallCommandOptions): BshEngineConfig {
  const host = options.host;
  const apiKey = options.apiKey;

  if (!host) throw new Error('Host is required. Use --host flag.');
  if (!apiKey) throw new Error('API key is required. Use --api-key flag.');

  return { host, apiKey };
}

export function createInstallCommand(): Command {
  const command = new Command('install')
    .alias('i');

  command
    .description('Install a plugin from a directory')
    .argument('<plugin-dir>', 'Path to the plugin directory')
    .option('--no-verbose', 'Disable verbose output')
    .option('-h, --host <host>', 'BSH Engine host URL')
    .option('-k, --api-key <key>', 'BSH Engine API key');

  command.action(async (pluginDir: string, options: InstallCommandOptions) => {
    const { verbose = true } = options;

    try {
      const config = getBshEngineConfig(options);

      await installPlugin(config, { pluginDir, verbose });
      process.exit(0);
    } catch (error) {
      logger.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

  return command;
}

