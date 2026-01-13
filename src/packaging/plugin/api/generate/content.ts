import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@src/logger';
import { directoryExists, fileExists } from '@utils/files';
import { CONFIG_FILE } from '@plugin/utils/plugin-path';
import { CONTENT_TEMPLATES } from './content-types';
import { promptMultiple, PromptField } from '@utils/prompt';

/**
 * Sets a value at a JSONPath-like target (e.g., $.name, $.pks[0].key)
 * Supports simple paths: $.property, $.array[0].property
 */
function setValueAtPath(obj: any, path: string, value: any): void {
  if (!path.startsWith('$.')) throw new Error(`[internal error] Invalid path: ${path}. Must start with "$."`);

  const parts = path.substring(2).split(/[.\[\]]+/).filter(p => p.length > 0);
  let current: any = obj;

  // Navigate to the parent of the target
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    // Check if next part is a number (array index)
    if (i + 1 < parts.length) {
      const nextPart = parts[i + 1];
      const nextIndex = parseInt(nextPart, 10);

      // If next part is a valid number, current part should be an array
      if (!isNaN(nextIndex)) {
        if (!Array.isArray(current[part])) {
          current[part] = [];
        }
        // Ensure array has enough elements
        while (current[part].length <= nextIndex) {
          current[part].push(null);
        }
        if (current[part][nextIndex] === null) {
          current[part][nextIndex] = {};
        }
        current = current[part][nextIndex];
        i++; // Skip the index part
        continue;
      }
    }

    // Regular object property
    if (current[part] === undefined || current[part] === null) {
      // Check if we need to create an object or array based on next part
      if (i + 1 < parts.length) {
        const nextPart = parts[i + 1];
        const nextIndex = parseInt(nextPart, 10);
        current[part] = !isNaN(nextIndex) ? [] : {};
      } else {
        current[part] = {};
      }
    }
    current = current[part];
  }

  // Set the final value
  const finalKey = parts[parts.length - 1];
  current[finalKey] = value;
}

/**
 * Replaces placeholder values in template (e.g., '<name>', '<description>') with null
 * and then applies user-provided values at their target paths
 */
function replacePlaceholders(template: any): any {
  if (typeof template === 'string') {
    // If string matches placeholder pattern, return null
    if (template.match(/^<[^>]+>$/)) return null;
    return template;
  }

  if (Array.isArray(template)) return template.map(item => replacePlaceholders(item));

  if (typeof template === 'object' && template !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = replacePlaceholders(value);
    }
    return result;
  }

  return template;
}

/**
 * Generate a content file inside a manifest directory using an entity's template structure
 */
export async function generateContentFile(
  name: string,
  manifestDir: string,
  entity: string,
  force: boolean = false,
  options: Record<string, any> = {},
  skipPrompts: boolean = false
): Promise<void> {
  const currentDir = process.cwd();
  const pluginConfigPath = join(currentDir, CONFIG_FILE);

  // Check if current directory is a plugin directory (contains bshplugin.json)
  const isPluginDir = await fileExists(pluginConfigPath);
  if (!isPluginDir) throw new Error(`Invalid bsh plugin directory. '${CONFIG_FILE}' not found.`);

  // Check if entity type exists in CONTENT_TYPES
  const templateConfig = CONTENT_TEMPLATES[entity];
  if (!templateConfig) throw new Error(`Unknown entity type "${entity}". Available types: ${Object.keys(CONTENT_TEMPLATES).join(', ')}`);

  // Check if manifest directory exists
  const manifestDirPath = join(currentDir, manifestDir);
  const manifestExists = await directoryExists(manifestDirPath);
  if (!manifestExists) throw new Error(`Manifest not found: ${manifestDir}`);

  // Check if content file already exists
  const contentFilePath = join(manifestDirPath, `${name}.json`);
  const contentExists = await fileExists(contentFilePath);
  if (contentExists && !force) throw new Error(`File "${name}.json" already exists in manifest "${manifestDir}"! Try with --override option.`);
  if (contentExists && force) logger.info(`overriding file "${name}.json" in manifest "${manifestDir}"`);

  try {
    // Create a deep copy of the template and replace placeholders with null
    const templateCopy = replacePlaceholders(JSON.parse(JSON.stringify(templateConfig.template)));

    // Prepare and apply values for each variable
    let userValues: Record<string, any> = {};

    if (!skipPrompts) {
      // Prepare prompt fields for each variable
      const promptFields: PromptField[] = templateConfig.variables.map(variable => {
        // Determine default value: priority: defaultFromOption > default > null
        let defaultValue: any = null;
        if (variable.defaultFromOption && options[variable.defaultFromOption] !== undefined) {
          defaultValue = options[variable.defaultFromOption];
        } else if (variable.default !== undefined) {
          defaultValue = variable.default;
        }

        // Build question text with allowed values if present
        let questionText = `${variable.name} (${variable.type})`;

        if (defaultValue !== null && defaultValue !== undefined) {
          questionText += ` [default: ${JSON.stringify(defaultValue)}]`;
        }

        questionText += ': ';

        return {
          name: variable.name,
          question: questionText,
          type: variable.type,
          defaultValue: defaultValue,
          allowedValues: variable.allowedValues
        };
      });

      // Prompt user for values
      logger.info(`\nPlease provide values for the following fields (press Enter to use default):\n`);
      userValues = await promptMultiple(promptFields);
    }

    // Apply user values to template at their target paths
    for (const variable of templateConfig.variables) {
      let value = userValues[variable.name];

      // If prompts are skipped or value is undefined/empty, use defaults
      if (skipPrompts || value === undefined || value === '' || (value === null && variable.type !== 'boolean')) {
        if (variable.defaultFromOption && options[variable.defaultFromOption] !== undefined) value = options[variable.defaultFromOption];
        else if (variable.default !== undefined) value = variable.default;
        else value = null;
      }

      // Set value at target path (always set, even if null, to replace placeholders)
      setValueAtPath(templateCopy, variable.target, value);
    }

    if (skipPrompts) logger.info(`Using default values for all fields (prompts disabled).`);

    // Write the new content file with the template structure
    await writeFile(contentFilePath, JSON.stringify(templateCopy, null, 2) + '\n', 'utf-8');

    logger.success(`Content file "${name}.json" created in manifest "${manifestDir}"`);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(`Failed to generate content file: ${String(error)}`);
  }
}

