import fs from 'fs';
import path from 'path';
import { PluginException } from '@plugin/errors';
import type { PluginPath, PluginRequest } from '@plugin/types';
import { createPluginPath } from '@plugin/utils/plugin-path';

/**
 * Discovers plugin files in a local directory
 */
export class PluginDiscovery {
  async discover(request: PluginRequest): Promise<PluginPath[]> {
    const basePath = request.path;

    if (!fs.existsSync(basePath)) {
      throw new PluginException(`Plugin directory not found: ${request.path}`, 404);
    }

    const stats = fs.statSync(basePath);
    if (!stats.isDirectory()) {
      throw new PluginException(`Plugin path is not a directory: ${request.path}`, 404);
    }

    return this.getPaths(basePath);
  }

  private getPaths(dir: string): PluginPath[] {
    const files = fs.readdirSync(dir);
    const results: PluginPath[] = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      const subpaths = stats.isDirectory() ? this.getPaths(filePath) : undefined;
      
      results.push(
        createPluginPath(
          filePath,
          stats.isFile(),
          stats.isDirectory(),
          subpaths
        )
      );
    }

    return results;
  }
}

