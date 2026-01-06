import fs from 'fs';
import { BshEngine } from '@bshsolutions/sdk';
import { PluginException } from '@plugin/errors';
import type {
  BshEngineConfig,
  PluginConfig,
  PluginContent,
  PluginManifest,
  PluginPath,
  PluginWrapper,
} from '@plugin/types';
import { JsonResolver } from '@plugin/utils/variable-resolver';
import { BshEntities } from '@bshsolutions/sdk/dist/types';
import { logger } from '@src/logger';

const BSH_ENTITIES = 'BshEntities';
const BSH_PLUGINS = 'BshPlugins';
const BSH_SCHEMAS = 'BshSchemas';

/**
 * Base plugin installer
 */
export abstract class BasePluginInstaller {
  protected bshengine: BshEngine;

  constructor(config: BshEngineConfig) {
    this.bshengine = new BshEngine({
      host: config.host,
      apiKey: config.apiKey,
    });
  }

  async install(pluginWrapper: PluginWrapper): Promise<void> {
    const config = pluginWrapper.config;
    const contents = pluginWrapper.contentList();

    // 1. Create BshEntities Table (if present)
    await this.installBshEntities(contents, config);

    // 2. Install plugin content
    for (const c of contents) {
      await this.installContent(c, config, contents);
    }

    // 3. Install plugin metadata
    await this.installPlugin(config, contents);
  }

  async uninstall(pluginWrapper: PluginWrapper): Promise<void> {
    // TODO: Implement uninstall
    throw new Error('Uninstall not yet implemented');
  }

  private async installBshEntities(
    contents: PluginContent[],
    config: PluginConfig
  ): Promise<void> {
    const bshEntitiesContent = contents.find(
      (p) => !p.isEmpty() && p.manifest.target === BSH_ENTITIES
    );

    if (!bshEntitiesContent) {
      return;
    }

    const manifest = bshEntitiesContent.manifest;

    // Insert all records from BshEntities content
    for (const file of bshEntitiesContent.files) {
      const json = await this.readJson(file, config, manifest);
      await this.insertRecord(
        file,
        json,
        config,
        manifest,
        BSH_ENTITIES,
        await this.getBshEntity()
      );
    }

    bshEntitiesContent.installed = true;
  }

  private async installContent(
    content: PluginContent,
    config: PluginConfig,
    contents: PluginContent[]
  ): Promise<void> {
    // Install dependencies first
    for (const dependency of content.dependencies) {
      if (dependency.installed) {
        continue;
      }
      await this.installContent(dependency, config, contents);
    }

    if (content.installed) {
      return;
    }

    const manifest = content.manifest;
    const targetEntity = manifest.target;

    // Install all files for this content
    for (const file of content.files) {
      const json = await this.readJson(file, config, manifest);
      if (json === null || json === undefined) {
        continue;
      }

      try {
        await this.insertRecord(
          file,
          json,
          config,
          manifest,
          targetEntity,
          await this.getBshEntity()
        );
      } catch (error) {
        logger.warn(
          `Insert to '${targetEntity}' from '${file.fileName}' failed:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue processing other files
      }
    }

    content.installed = true;
  }

  private async installPlugin(
    config: PluginConfig,
    contents: PluginContent[]
  ): Promise<void> {
    const pluginContent: Record<string, unknown> = {
      ...config,
      lastInstalledAt: {
        $date: new Date().toISOString()
      },
    };

    // Create a dummy path for the plugin config
    const configPath: PluginPath = {
      path: 'bshplugin.json',
      fileName: 'bshplugin.json',
      isFile: true,
      isDirectory: false,
      isManifest: false,
      isConfig: true,
      isContent() {
        return false;
      },
    };

    await this.insertRecord(
      configPath,
      pluginContent,
      config,
      null,
      BSH_PLUGINS,
      await this.getBshEntity()
    );
  }

  private async insertRecord(
    file: PluginPath,
    json: unknown,
    config: PluginConfig,
    manifest: PluginManifest | null,
    targetEntity: string,
    bshEntity?: BshEntities
  ): Promise<void> {
    if (json === null || json === undefined) {
      return;
    }

    // Add bshPlugin field if needed (for plugin-based entities)
    // Note: We don't have a way to check if entity is plugin-based in TS
    // So we'll add it by default
    const addPluginField = (obj: Record<string, unknown>) => {
      if (targetEntity !== BSH_PLUGINS && bshEntity?.isPluginBased) {
        obj.bshPlugin = config.id;
      }
    };

    if (Array.isArray(json)) {
      for (let i = 0; i < json.length; i++) {
        const item = json[i];
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          addPluginField(item as Record<string, unknown>);
          await this.insertEntityRecord(targetEntity, item, file, i);
        } else {
          logger.warn(
            `Insert to '${targetEntity}' [${i}] from '${file.fileName}' Failed, expecting object not ${typeof item}`
          );
        }
      }
    } else if (typeof json === 'object' && json !== null) {
      addPluginField(json as Record<string, unknown>);
      await this.insertEntityRecord(targetEntity, json, file);
    }
  }

  private async insertEntityRecord(
    targetEntity: string,
    payload: unknown,
    file: PluginPath,
    index?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.bshengine.entity(targetEntity).create({
        payload: payload as Record<string, unknown>,
        onSuccess: () => {
          const indexStr = index !== undefined ? ` [${index}]` : '';
          logger.info(
            `Insert to '${targetEntity}'${indexStr} from '${file.fileName}'`
          );
          resolve();
        },
        onError: (error) => {
          const indexStr = index !== undefined ? ` [${index}]` : '';
          const errorMessage = this.formatError(error);
          logger.error(
            `Insert to '${targetEntity}'${indexStr} from '${file.fileName}' failed:`,
            errorMessage
          );
          reject(new Error(errorMessage));
        },
      });
    });
  }

  private async getBshEntity(): Promise<BshEntities | undefined> {
    try {
      const response = await this.bshengine.core.BshEntities.findById({
        id: BSH_ENTITIES,
      });
      if (response?.data && response.data.length > 0) {
        return response.data[0];
      }
    } catch (error) {
      const errorMessage = this.formatError(error);
      logger.error(`Failed to get BshEntity: ${errorMessage}`);
      return undefined;
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      // Check for connection errors
      const errorString = error.toString();
      const cause = (error as any).cause;
      
      // Check if cause is a Node.js system error with connection details
      if (cause && typeof cause === 'object' && 'code' in cause) {
        const sysError = cause as { code?: string; address?: string; port?: number };
        if (sysError.code === 'ECONNREFUSED') {
          const address = sysError.address || 'unknown';
          const port = sysError.port || 'unknown';
          return `Connection refused to ${address}:${port}. Please ensure the BshEngine server is running and accessible at the configured host.`;
        }
      }
      
      if (errorString.includes('ECONNREFUSED') || errorString.includes('fetch failed')) {
        return `Connection failed. Please ensure the BshEngine server is running and accessible at the configured host. Original error: ${error.message}`;
      }
      
      return error.message;
    }
    return String(error);
  }

  protected abstract readJson(
    file: PluginPath,
    config: PluginConfig,
    manifest: PluginManifest | null
  ): Promise<unknown>;
}

/**
 * Local filesystem plugin installer
 */
export class PluginInstaller extends BasePluginInstaller {
  protected async readJson(
    file: PluginPath,
    config: PluginConfig,
    manifest: PluginManifest | null
  ): Promise<unknown> {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      let json = JSON.parse(content);

      // Resolve variables ${config.*} ${manifest.*}
      json = JsonResolver.resolve(json, config.variables || config, false);
      if (manifest) {
        json = JsonResolver.resolve(json, manifest.variables || manifest, false);
      }

      return json;
    } catch (error) {
      throw new PluginException(
        `Failed to read file: ${file.path} - ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }
}

