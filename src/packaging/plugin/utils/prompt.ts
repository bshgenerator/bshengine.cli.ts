import { createInterface, Interface } from 'readline';

/**
 * Creates a readline interface for prompting user input
 */
function createReadlineInterface(): Interface {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt<T = string>(
  question: string,
  transform: (input: string) => T,
  defaultValue?: T
): Promise<T | undefined> {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();

    rl.question(question, (answer) => {
      rl.close();
      resolve(transform(answer.trim()) || defaultValue);
    });
  });
}

async function promptString(
  question: string,
  defaultValue?: string
): Promise<string | undefined> {
  return prompt(question, (input) => input.trim(), defaultValue);
}

async function promptNumber(
  question: string,
  defaultValue?: number
): Promise<number | undefined> {
  return prompt(question, (input) => {
    const parsed = parseFloat(input.trim());
    return isNaN(parsed) ? NaN : parsed;
  }, defaultValue);
}

async function promptBoolean(
  question: string,
  defaultValue?: boolean
): Promise<boolean | undefined> {
  return prompt(question, (input) => {
    const lower = input.toLowerCase().trim();
    return lower === 'y' || lower === 'yes' || lower === 'true' || lower === '1';
  }, defaultValue);
}

async function promptInteger(
  question: string,
  defaultValue?: number
): Promise<number | undefined> {
  return prompt(question, (input) => {
    const parsed = parseInt(input.trim(), 10);
    return isNaN(parsed) ? NaN : parsed;
  }, defaultValue);
}

export const promptFns: Record<string, (question: string, defaultValue?: any) => Promise<any>> = {
  string: promptString,
  number: promptNumber,
  boolean: promptBoolean,
  integer: promptInteger,
}

/**
 * Field definition for multiple prompts with type support
 */
export type PromptField<T = string> = {
  name: string;
  question: string;
  type?: 'string' | 'number' | 'integer' | 'boolean';
  defaultValue?: T;
};

/**
 * Prompts the user for multiple fields with type support
 * @param fields Array of field prompts with optional type information
 * @returns Object with field names as keys and typed user input as values
 */
export async function promptMultiple(
  fields: Array<PromptField<any>>
): Promise<Record<string, any>> {
  const results: any = {};

  for (const field of fields) {
    let answer: any;

    if (field.type === 'number') answer = await promptFns.number(field.question, field.defaultValue);
    else if (field.type === 'integer') answer = await promptFns.integer(field.question, field.defaultValue);
    else if (field.type === 'boolean') answer = await promptFns.boolean(field.question, field.defaultValue);
    else answer = await promptFns.string(field.question, field.defaultValue);

    results[field.name] = answer;
  }

  return results;
}
