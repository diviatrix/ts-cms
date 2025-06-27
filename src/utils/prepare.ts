import IResolve from '../types/IResolve';

export default class prep {
  // Overload signature for accepting an IResolve object with optional callerInfo
  public static response<T>(result: IResolve<T>, callerInfo?: string): IResolve<T>;

  // Implementation signature for accepting individual parameters with optional callerInfo
  public static response<T>(success: boolean, message: string, data?: T): IResolve<T>;

  // Actual implementation that handles both cases
  public static response<T>(arg1: boolean | IResolve<T>, message?: string, data?: T, callerInfo?: string): IResolve<T> {
    let result: IResolve<T>;

    if (typeof arg1 === 'boolean') {
      // Case 1: Called with individual parameters
      result = {
        success: arg1,
        message: message as string, // Cast message as it's required in this case
        data: data || undefined // Use data if provided, otherwise undefined
      };
    } else {
      // Case 2: Called with an IResolve object
      result = arg1;
    }

    // Add callerInfo to the console log
    if (message) {
      console.log(`${message}${callerInfo ? ` <${callerInfo}>` : ''}:`, result);
    }
    else {
      console.log(`${callerInfo ? ` <${callerInfo}>` : ''}:`, result);
    }

    return result;
  }
}
