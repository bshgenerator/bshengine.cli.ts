import { Command } from 'commander';
import { createInstallCommand } from './cmds/install';

/**
 * Creates the plugins command group with all plugin-related subcommands
 */
export function createPluginsCommand(): Command {
  const pluginsCommand = new Command('plugins')
    .description('Manage BSH Engine plugins');

  // Register all plugin commands
  const cmds = [
    createInstallCommand,
  ];

  for (const commandFactory of cmds) {
    const command = commandFactory();
    pluginsCommand.addCommand(command);
  }

  return pluginsCommand;
}

