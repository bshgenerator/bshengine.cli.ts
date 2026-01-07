import { rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '@src/logger';
import { directoryExists, fileExists } from '@utils/files';
import { CONFIG_FILE } from '@plugin/utils/plugin-path';

/**
 * Generate a manifest directory with __manifest__.json
 */
export async function generateManifestDirectory(name: string, targetOverride?: string): Promise<void> {
  const currentDir = process.cwd();
  const pluginConfigPath = join(currentDir, CONFIG_FILE);
  const manifestDirPath = join(currentDir, name);
  const manifestFilePath = join(manifestDirPath, '__manifest__.json');
  const target = targetOverride || name;

  // Check if current directory is a plugin directory (contains bshplugin.json)
  const isPluginDir = await fileExists(pluginConfigPath);
  if (!isPluginDir) {
    throw new Error(`Invalid bsh plugin directory. '${CONFIG_FILE}' not found.`);
  }

  // Check if directory already exists
  const dirExists = await directoryExists(manifestDirPath);
  if (dirExists) {
    throw new Error(`Manifest "${name}" already exists`);
  }

  try {
    // Create the directory
    await mkdir(manifestDirPath, { recursive: false });

    // Create the manifest file content
    const manifestContent = {
      target: target,
      dependencies: ['BshEntities']
    };

    // Write the manifest file
    await writeFile(manifestFilePath, JSON.stringify(manifestContent, null, 2) + '\n', 'utf-8');

    logger.success(`Manifest "${name}"`);
  } catch (error) {
    // Clean up directory if it was created but manifest file creation failed
    try {
      const cleanupDirExists = await directoryExists(manifestDirPath);
      if (cleanupDirExists) {
        await rm(manifestDirPath, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate manifest directory');
  }
}
