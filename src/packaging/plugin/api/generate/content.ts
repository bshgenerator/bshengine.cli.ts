import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@src/logger';
import { directoryExists, fileExists } from '@utils/files';
import { CONFIG_FILE } from '@plugin/utils/plugin-path';
import { CONTENT_TYPES } from './content-types';

/**
 * Generate a content file inside a manifest directory using an entity's template structure
 */
export async function generateContentFile(
  name: string,
  manifestDir: string,
  entity: string,
  override: boolean = false
): Promise<void> {
  const currentDir = process.cwd();
  const pluginConfigPath = join(currentDir, CONFIG_FILE);

  // Check if current directory is a plugin directory (contains bshplugin.json)
  const isPluginDir = await fileExists(pluginConfigPath);
  if (!isPluginDir) throw new Error(`Invalid bsh plugin directory. '${CONFIG_FILE}' not found.`);

  // Check if entity type exists in CONTENT_TYPES
  const template = CONTENT_TYPES[entity];
  if (!template) throw new Error(`Unknown entity type "${entity}". Available types: ${Object.keys(CONTENT_TYPES).join(', ')}`);

  // Check if manifest directory exists
  const manifestDirPath = join(currentDir, manifestDir);
  const manifestExists = await directoryExists(manifestDirPath);
  if (!manifestExists) throw new Error(`Manifest not found: ${manifestDir}`);

  // Check if content file already exists
  const contentFilePath = join(manifestDirPath, `${name}.json`);
  const contentExists = await fileExists(contentFilePath);
  if (contentExists && !override) throw new Error(`File "${name}.json" already exists in manifest "${manifestDir}"! Try with --override option.`);

  try {
    // Create a deep copy of the template to avoid modifying the original
    const templateCopy = JSON.parse(JSON.stringify(template));

    // Write the new content file with the template structure
    await writeFile(contentFilePath, JSON.stringify(templateCopy, null, 2) + '\n', 'utf-8');

    logger.success(`Content file "${name}.json" created in manifest "${manifestDir}"`);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(`Failed to generate content file: ${String(error)}`);
  }
}

