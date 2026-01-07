import { Command } from 'commander';
import { generatePlugin } from '@plugin/api/generate';
import { logger } from '@src/logger';

export const TEMPLATE_REPO_URL = 'https://github.com/bshgenerator/bshengine.plugin.template.git';
export const DEFAULT_PLUGIN_NAME = 'bshplugin';

export type GenerateCommandOptions = {
  name?: string;
  template?: string;
  path?: string;
  clean?: boolean;
};

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .alias('g');

  command
    .description('Generate a new plugin from the template repository')
    .option('-n, --name <name>', `Plugin directory name`, DEFAULT_PLUGIN_NAME)
    .option('-t, --template <url>', `Template repository URL`, TEMPLATE_REPO_URL)
    .option('-p, --path <path>', 'Path to where the plugin will be generated', '.')
    .option('-c, --clean', 'Remove sample.json files from generated plugin');

  command.action(async (options: GenerateCommandOptions) => {
    const {
      name = DEFAULT_PLUGIN_NAME,
      template = TEMPLATE_REPO_URL,
      path = '.',
      clean = false
    } = options;

    try {
      await generatePlugin(path, name, template, clean);
      process.exit(0);
    } catch (error) {
      logger.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

  return command;
}

