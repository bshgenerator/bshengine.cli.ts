import { Command } from 'commander';
import { createSetupCommand } from './setup';

/**
 * Creates the docker command group with all docker-related subcommands
 */
export function createDockerCommand(): Command {
  const dockerCommand = new Command('docker')
    .alias('d')
    .description('Manage Docker configuration for BSH Engine');

  // Register all docker commands
  dockerCommand.addCommand(createSetupCommand());

  return dockerCommand;
}
