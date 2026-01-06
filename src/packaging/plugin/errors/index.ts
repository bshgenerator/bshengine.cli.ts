/**
 * Plugin exception with status code
 */
export class PluginException extends Error {
    public readonly status: number;
  
    constructor(message: string | Error, status: number = 500) {
      const msg = message instanceof Error ? message.message : message;
      super(msg);
      this.name = 'PluginException';
      this.status = status;
      Error.captureStackTrace(this, this.constructor);
      if (message instanceof Error) {
        this.stack = message.stack;
      }
    }
  }
  
  