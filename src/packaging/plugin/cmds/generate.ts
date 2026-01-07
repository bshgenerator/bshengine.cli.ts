import { Command } from 'commander';
import { generatePlugin, generateManifestDirectory, generateContentFile } from '@plugin/api/generate';
import { logger } from '@src/logger';

export const TEMPLATE_REPO_URL = 'https://github.com/bshgenerator/bshengine.plugin.template.git';
export const DEFAULT_PLUGIN_NAME = 'bshplugin';

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .alias('g');

  // Plugin generation command (default action)
  command
    .description('Generate a new plugin from the template repository')
    .option('-n, --name <name>', `Plugin directory name`, DEFAULT_PLUGIN_NAME)
    .option('-t, --template <url>', `Template repository URL`, TEMPLATE_REPO_URL)
    .option('-p, --path <path>', 'Path to where the plugin will be generated', '.')
    .option('-c, --clean', 'Remove sample.json files from generated plugin')
    .action(async (options: {
      name?: string;
      template?: string;
      path?: string;
      clean?: boolean;
    }) => {
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

  // Manifest generation subcommand
  const manifestCommand = new Command('manifest')
    .alias('m')
    .description('Generate a new manifest directory')
    .argument('<name>', 'Name of the manifest directory to create')
    .option('-t, --target <target>', 'Target Entity (dir name)')
    .option('-d, --dependencies <dependencies>', 'Comma-separated list of additional dependencies (BshEntities is always included)')
    .action(async (name: string, options: { target?: string; dependencies?: string }) => {
      try {
        // Parse dependencies: split by comma, trim whitespace, filter empty strings
        const additionalDependencies = options.dependencies
          ? options.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0)
          : undefined;

        await generateManifestDirectory(name, options.target, additionalDependencies);
        process.exit(0);
      } catch (error) {
        logger.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Content generation subcommand
  const contentCommand = new Command('content')
    .alias('c')
    .description('Generate a new content file inside a manifest directory')
    .argument('<name>', 'Name of the content file to create (without .json extension)')
    .requiredOption('-m, --manifest <manifest>', 'Manifest directory name where the file will be created')
    .option('-e, --entity <entity>', 'Entity name to get the JSON structure from (e.g., BshPolicies, BshEntities)')
    .option('-o, --override', 'Override existing content file if it exists')
    .option('--skipprompts', 'Skip interactive prompts and use default values only')
    .action(async (name: string, options: { manifest: string; entity: string; override?: boolean; skipprompts?: boolean }) => {
      try {
        // Pass options object with 'name' for defaultFromOption support
        await generateContentFile(
          name, 
          options.manifest, 
          options.entity || options.manifest, 
          options.override || false,
          { name }, // Pass name as option for defaultFromOption
          options.skipprompts || false
        );
        process.exit(0);
      } catch (error) {
        logger.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  command.addCommand(manifestCommand);
  command.addCommand(contentCommand);

  return command;
}
