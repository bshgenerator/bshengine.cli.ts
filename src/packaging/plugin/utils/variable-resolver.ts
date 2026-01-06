/**
 * Resolves variables in JSON objects
 * Supports ${config.*} and ${manifest.*} syntax
 */
export class JsonResolver {
  /**
   * Resolves variables in a JSON value
   */
  static resolve(
    value: unknown,
    variables: Record<string, unknown> | null | undefined,
    strict: boolean = false
  ): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.resolveString(value, variables, strict);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolve(item, variables, strict));
    }

    if (typeof value === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolve(val, variables, strict);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Resolves variables in a string
   */
  private static resolveString(
    str: string,
    variables: Record<string, unknown> | null | undefined,
    strict: boolean
  ): string {
    if (!variables) {
      return str;
    }

    // Match ${variable.path} patterns
    const regex = /\$\{([^}]+)\}/g;
    return str.replace(regex, (match, varPath) => {
      const value = this.getVariableValue(varPath, variables);
      if (value === undefined) {
        if (strict) {
          throw new Error(`Variable not found: ${match}`);
        }
        return match;
      }
      return String(value);
    });
  }

  /**
   * Gets a variable value using dot notation (e.g., "config.id" or "manifest.target")
   */
  private static getVariableValue(
    varPath: string,
    variables: Record<string, unknown>
  ): unknown {
    const parts = varPath.split('.');
    let current: unknown = variables;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object' && !Array.isArray(current)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

