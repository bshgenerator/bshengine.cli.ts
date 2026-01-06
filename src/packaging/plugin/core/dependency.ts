import { PluginException } from '@plugin/errors';
import type { PluginContent } from '@plugin/types';

/**
 * Validates plugin dependencies and checks for circular dependencies
 */
export class PluginDependency {
  check(content: Record<string, PluginContent>): void {
    this.resolveDependencies(content);
    this.checkCircleDependency(content);
  }

  private resolveDependencies(content: Record<string, PluginContent>): void {
    for (const el of Object.values(content)) {
      const dependencies = el.manifest.dependencies;
      if (!dependencies || dependencies.length === 0) {
        continue;
      }

      for (const depId of dependencies) {
        const dependency = content[depId];
        if (dependency) {
          el.dependencies.push(dependency);
        }
      }
    }
  }

  private checkCircleDependency(content: Record<string, PluginContent>): void {
    // Check self-dependency
    for (const c of Object.values(content)) {
      const selfDependency = c.dependencies.some(
        (d) => d.manifest.target === c.manifest.target
      );
      if (selfDependency) {
        throw new PluginException(
          `Self dependency detected in: ${c.manifest.target}`,
          400
        );
      }
    }

    // Check circular dependencies
    const recursionStack: string[] = [];

    for (const id of Object.keys(content)) {
      if (this.detectCycle(id, recursionStack, content)) {
        throw new PluginException(
          `Circular dependency detected: ${recursionStack.join('->')} in ${content[id]!.manifest.target}`,
          400
        );
      }
    }
  }

  private detectCycle(
    id: string,
    recursionStack: string[],
    content: Record<string, PluginContent>
  ): boolean {
    if (!id || !content[id]) {
      return false;
    }

    const visited = recursionStack.includes(id);
    recursionStack.push(id);

    if (visited) {
      return true;
    }

    const dependencies = content[id]!.dependencies;
    if (dependencies) {
      for (const dep of dependencies) {
        if (dep && dep.manifest) {
          const depId = dep.manifest.target;
          if (this.detectCycle(depId, recursionStack, content)) {
            return true;
          }
        }
      }
    }

    recursionStack.pop();
    return false;
  }
}

