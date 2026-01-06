/**
 * Configuration for BSH Engine connection
 */
export interface BshEngineConfig {
  host: string;
  apiKey: string;
}

/**
 * Plugin request
 */
export interface PluginRequest {
  path: string;
}

/**
 * Plugin configuration from bshplugin.json
 */
export interface PluginConfig {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Plugin manifest from __manifest__.json
 */
export interface PluginManifest {
  target: string;
  tempSchema?: string;
  dependencies?: string[];
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Plugin path representing a file or directory
 */
export interface PluginPath {
  path: string;
  fileName: string;
  subpaths?: PluginPath[];
  isFile: boolean;
  isDirectory: boolean;
  isManifest: boolean;
  isConfig: boolean;
  isContent(): boolean;
}

/**
 * Plugin content for a specific target entity
 */
export interface PluginContent {
  manifest: PluginManifest;
  files: PluginPath[];
  dependencies: PluginContent[];
  installed: boolean;
  isEmpty(): boolean;
}

/**
 * Plugin wrapper containing config and content
 */
export interface PluginWrapper {
  config: PluginConfig;
  contentMap: Record<string, PluginContent>;
  contentList(): PluginContent[];
}

/**
 * Options for installing plugins
 */
export interface InstallOptions {
  pluginDir?: string;
  verbose?: boolean;
}

/**
 * Options for cleaning entities
 */
export interface CleanOptions {
  entities?: string[];
  memberRoleFilter?: string;
}

