import type { PluginContent, PluginManifest, PluginPath } from '@plugin/types';

/**
 * Creates a PluginContent instance
 */
export function createPluginContent(
  manifest: PluginManifest,
  files: PluginPath[] = []
): PluginContent {
  const dependencies: PluginContent[] = [];

  return {
    manifest,
    files,
    dependencies,
    installed: false,
    isEmpty() {
      return !this.files || this.files.length === 0;
    },
  };
}

