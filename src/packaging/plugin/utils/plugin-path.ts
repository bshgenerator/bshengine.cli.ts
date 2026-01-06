import type { PluginPath } from '@plugin/types';
import path from 'path';

const MANIFEST_FILE = '__manifest__.json';
const CONFIG_FILE = 'bshplugin.json';

/**
 * Creates a PluginPath from a file system path
 */
export function createPluginPath(
  filePath: string,
  isFile: boolean,
  isDirectory: boolean,
  subpaths?: PluginPath[]
): PluginPath {
  const fileName = path.basename(filePath);
  const isManifest = isFile && fileName === MANIFEST_FILE;
  const isConfig = isFile && fileName === CONFIG_FILE;

  return {
    path: filePath,
    fileName,
    subpaths,
    isFile,
    isDirectory,
    isManifest,
    isConfig,
    isContent() {
      return this.isFile && !this.isConfig && !this.isManifest;
    },
  };
}

export { MANIFEST_FILE, CONFIG_FILE };

