export const logger: ILogger = {
  error: (message: string, error?: Error) => {
    console.error(message, error);
  },
  info: function (message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  },
  warn: function (message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
};

export interface ILogger {
  error(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
}
