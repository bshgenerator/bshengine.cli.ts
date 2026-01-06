import fs from 'fs';
import { PluginException } from '@plugin/errors';
import type { PluginConfig, PluginContent, PluginManifest, PluginPath, PluginWrapper } from '@plugin/types';
import { createPluginContent } from '@plugin/utils/plugin-content';
import { MANIFEST_FILE, CONFIG_FILE } from '@plugin/utils/plugin-path';

/**
 * Parses plugin structure from discovered paths
 */
export class PluginParser {
  parse(paths: PluginPath[]): PluginWrapper {
    if (!paths || paths.length === 0) {
      throw new PluginException('Empty Plugin', 400);
    }

    const contentMap: Record<string, PluginContent> = {};
    const config = this.readConfig(paths);
    this.readContent(paths, null, contentMap);

    return {
      config,
      contentMap,
      contentList() {
        return Object.values(this.contentMap);
      },
    };
  }

  private readFile(path: PluginPath): unknown {
    try {
      const content = fs.readFileSync(path.path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new PluginException(
        `Failed to read file: ${path.path} - ${error instanceof Error ? error.message : String(error)}`,
        400
      );
    }
  }

  private readConfig(paths: PluginPath[]): PluginConfig {
    const pluginConfig = paths.find((p) => p.isConfig);
    
    if (!pluginConfig || !pluginConfig.path) {
      throw new PluginException(
        `Plugin config not found, please add ${CONFIG_FILE}`,
        400
      );
    }

    try {
      const jsonNode = this.readFile(pluginConfig);
      if (typeof jsonNode !== 'object' || jsonNode === null || Array.isArray(jsonNode)) {
        throw new PluginException(
          `Object was expected for plugin config but found ${Array.isArray(jsonNode) ? 'array' : typeof jsonNode} in ${pluginConfig.path}`,
          400
        );
      }

      const config = jsonNode as PluginConfig;
      if (!config.id) {
        throw new PluginException('Plugin config must have an "id" field', 400);
      }

      return config;
    } catch (error) {
      if (error instanceof PluginException && error.status === 400) {
        throw error;
      }
      throw new PluginException(
        `Failed to read config: ${pluginConfig.path} - ${error instanceof Error ? error.message : String(error)}`,
        400
      );
    }
  }

  private readContent(
    paths: PluginPath[] | undefined,
    manifest: PluginManifest | null,
    content: Record<string, PluginContent>
  ): void {
    if (!paths || paths.length === 0) {
      return;
    }

    let currentManifest = manifest;

    // Find manifest file if we don't have one yet
    if (currentManifest === null) {
      const manifestFile = paths.find((p) => p.isManifest);
      if (manifestFile) {
        try {
          const manifestData = this.readFile(manifestFile) as PluginManifest;
          if (!manifestData.target) {
            throw new PluginException(
              `Manifest must have a "target" field: ${manifestFile.path}`,
              400
            );
          }
          currentManifest = manifestData;
        } catch (error) {
          if (error instanceof PluginException && error.status === 400) {
            throw error;
          }
          throw new PluginException(
            `Failed to read manifest: ${manifestFile.path} - ${error instanceof Error ? error.message : String(error)}`,
            400
          );
        }
      }
    }

    if (currentManifest === null) {
      // No manifest found, recurse into subdirectories
      for (const p of paths) {
        if (p.subpaths) {
          this.readContent(p.subpaths, null, content);
        }
      }
    } else {
      // We have a manifest, collect all content files recursively
      const target = currentManifest.target;
      const contentPaths: PluginPath[] = [];
      const stack: PluginPath[] = [...paths];

      while (stack.length > 0) {
        const current = stack.pop()!;
        // Only add content files (not manifest or config files)
        if (current.isContent()) {
          contentPaths.push(current);
        }
        if (current.subpaths) {
          stack.push(...current.subpaths);
        }
      }

      if (content[target]) {
        content[target]!.files.push(...contentPaths);
      } else {
        content[target] = createPluginContent(currentManifest, contentPaths);
      }

      // Also recurse into subdirectories that might have their own manifests
      for (const p of paths) {
        if (p.subpaths && !p.isManifest) {
          this.readContent(p.subpaths, null, content);
        }
      }
    }
  }
}

