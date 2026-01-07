import { Command } from 'commander';
import { createInstallCommand } from './cmds/install';
import { createValidateCommand } from './cmds/validate';
import { createGenerateCommand } from './cmds/generate';

/**
 * Creates the plugins command group with all plugin-related subcommands
 */
export function createPluginsCommand(): Command {
  const pluginsCommand = new Command('plugins')
    .alias('p')
    .description('Manage BSH Engine plugins');

  // Register all plugin commands
  pluginsCommand.addCommand(createInstallCommand());
  pluginsCommand.addCommand(createValidateCommand());
  pluginsCommand.addCommand(createGenerateCommand());

  return pluginsCommand;
}

