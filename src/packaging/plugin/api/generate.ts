import { exec } from 'child_process';
import { promisify } from 'util';
import { rm, rename, access, readFile, writeFile, readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { logger } from '@src/logger';
import { promptMultiple } from '../utils/prompt';

const execAsync = promisify(exec);

/**
 * Check if a directory exists
 */
async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a plugin from the template repository
 */
export async function generatePlugin(
  targetDir: string,
  pluginName: string,
  templateUrl: string,
  clean: boolean = false
): Promise<void> {
  const resolvedTargetDir = resolve(targetDir);
  const finalPluginPath = join(resolvedTargetDir, pluginName);

  // Check if target directory exists
  const targetExists = await directoryExists(resolvedTargetDir);
  if (!targetExists) {
    throw new Error(`Target directory does not exist: ${resolvedTargetDir}`);
  }

  // Check if plugin directory already exists
  const pluginExists = await directoryExists(finalPluginPath);
  if (pluginExists) {
    throw new Error(`Plugin already exists: ${finalPluginPath}`);
  }

  // Create a temporary directory for cloning
  const tempDir = join(tmpdir(), `bsh-plugin-template-${Date.now()}`);

  try {
    logger.info(`Cloning template repository: ${templateUrl}`);

    // Clone the repository into temp directory
    await execAsync(`git clone ${templateUrl} "${tempDir}"`);

    // Remove .github directory
    const githubDir = join(tempDir, '.github');
    const githubExists = await directoryExists(githubDir);
    if (githubExists) {
      logger.info('Cleaning...');
      await rm(githubDir, { recursive: true, force: true });
    }

    // Remove .git directory to avoid conflicts
    const gitDir = join(tempDir, '.git');
    const gitExists = await directoryExists(gitDir);
    if (gitExists) {
      logger.info('Cleaning...');
      await rm(gitDir, { recursive: true, force: true });
    }

    // Move the cloned template to the final location
    logger.info(`Generating new plugin...`);
    await rename(tempDir, finalPluginPath);

    logger.success(`Plugin "${pluginName}" generated at: ${finalPluginPath}`);

    // Prompt user for plugin information
    const userResponse = await promptForPluginInfo(finalPluginPath, pluginName);

    // Remove sample.json files if clean option is enabled
    if (clean || userResponse.clean) await removeSampleFiles(finalPluginPath);
  } catch (error) {
    // Clean up temp directory on error
    try {
      const tempExists = await directoryExists(tempDir);
      if (tempExists) {
        await rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    if (error instanceof Error) {
      // Check if git is not installed
      if (error.message.includes('git') || error.message.includes('spawn')) {
        throw new Error('Git is required to generate plugins. Please install Git and try again.');
      }
      throw error;
    }
    throw new Error('Failed to generate plugin');
  }
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively find and remove all sample.json files from the plugin directory
 * Also removes the BshConfigurations directory
 */
async function removeSampleFiles(pluginPath: string): Promise<void> {
  try {
    logger.info(`Cleaning...`);

    const sampleFiles: string[] = [];

    /**
     * Recursively search for sample.json files
     */
    async function findSampleFiles(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively search in subdirectories
          await findSampleFiles(fullPath);
        } else if (entry.isFile() && entry.name === 'sample.json') {
          sampleFiles.push(fullPath);
        }
      }
    }

    await findSampleFiles(pluginPath);

    // Remove sample.json files
    if (sampleFiles.length > 0) {
      for (const file of sampleFiles) {
        await rm(file, { force: true });
      }
    }

    // Remove BshConfigurations directory
    const bshConfigurationsPath = join(pluginPath, 'BshConfigurations');
    const bshConfigurationsExists = await directoryExists(bshConfigurationsPath);
    if (bshConfigurationsExists) {
      await rm(bshConfigurationsPath, { recursive: true, force: true });
    }
  } catch (error) {
    logger.warn('Failed to remove sample files and directories:', error instanceof Error ? error.message : String(error));
    // Don't throw - allow the plugin generation to succeed even if cleanup fails
  }
}

/**
 * Prompts the user for plugin information and updates bshplugin.json
 */
async function promptForPluginInfo(pluginPath: string, pluginName: string): Promise<Record<string, string>> {
  const bshpluginJsonPath = join(pluginPath, 'bshplugin.json');

  try {
    // Check if bshplugin.json exists
    const fileExistsCheck = await fileExists(bshpluginJsonPath);
    if (!fileExistsCheck) {
      logger.warn('bshplugin.json not found, skipping plugin config update');
      return {};
    }

    // Read the current bshplugin.json
    const currentContent = await readFile(bshpluginJsonPath, 'utf-8');
    const pluginConfig = JSON.parse(currentContent);

    logger.info('Please provide plugin information (press Enter to skip):');

    // Prompt for all plugin fields
    let userInput = await promptMultiple([
      { name: 'id', question: `Plugin ID (${pluginName}): `, type: 'string', defaultValue: pluginName },
      { name: 'name', question: `Plugin Name (${pluginName}): `, type: 'string', defaultValue: pluginName },
      { name: 'description', question: 'Plugin Description: ', type: 'string', defaultValue: '' },
      { name: 'author', question: 'Plugin Author: ', type: 'string', defaultValue: '' },
      { name: 'version', question: 'Plugin Version (0.0.1): ', type: 'string', defaultValue: '0.0.1' },
      { name: 'license', question: 'License (MIT): ', type: 'string', defaultValue: 'MIT' },
      { name: 'clean', question: 'Remove sample files (y/n): ', type: 'boolean', defaultValue: false },
    ]);

    // Update only fields where user provided input
    pluginConfig.id = userInput.id || pluginName;
    pluginConfig.name = userInput.name || pluginName;
    pluginConfig.description = userInput.description || '';
    pluginConfig.author = userInput.author || '';
    pluginConfig.version = userInput.version || '0.0.1';
    pluginConfig.license = userInput.license || 'MIT';
    pluginConfig.image = '';

    // Write the updated configuration back to file
    await writeFile(bshpluginJsonPath, JSON.stringify(pluginConfig, null, 2) + '\n', 'utf-8');

    logger.info('bshplugin.json updated');
    return userInput;
  } catch (error) {
    logger.warn('Failed to update plugin information:', error instanceof Error ? error.message : String(error));
    // Don't throw - allow the plugin generation to succeed even if info update fails
    return {};
  }
}
