import type { BshEngineConfig, InstallOptions } from '@plugin/types';
import { PluginManager } from '@plugin/core/manager';
import { PluginException } from '@plugin/errors';
import { logger } from '@src/logger';

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
      logger.separator();
      logger.info('Installing plugins...');
    }

    const manager = new PluginManager(config);

    await manager.manage({
      path: pluginDir
    });

    if (verbose) {
      logger.success('Plugin installation completed successfully!');
    }
  } catch (error) {
    if (error instanceof PluginException) {
      logger.error(`ERROR: ${error.status} - ${error.message}`);
    } else {
      logger.error(`ERROR: 500 - Error installing plugin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
