import type { BshEngineConfig, InstallOptions } from '@plugin/types';
import { PluginManager } from '@plugin/core/manager';
import { PluginException } from '@plugin/errors';

export async function installPlugin(
  config: BshEngineConfig,
  options: InstallOptions = {}
): Promise<void> {
  try {
    const { pluginDir, verbose = true } = options;

    if (!pluginDir) {
      throw new Error('pluginDir is required in options');
    }

    if (verbose) {
      console.log('========================================');
      console.log('Installing plugins...');
    }

    const manager = new PluginManager(config);

    await manager.manage({
      path: pluginDir
    });

    if (verbose) {
      console.log('Plugin installation completed successfully!');
    }
  } catch (error) {
    if (error instanceof PluginException) {
      console.error(`ERROR: ${error.status} - ${error.message}`);
    } else {
      console.error(`ERROR: 500 - Error installing plugin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
