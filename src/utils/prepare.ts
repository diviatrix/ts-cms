import IResolve from '../types/IResolve';

export default class prep {
  // Overload signature for accepting an IResolve object with optional callerInfo
  public static response(result: IResolve, callerInfo?: string): IResolve;

  // Implementation signature for accepting individual parameters with optional callerInfo
  public static response(success: boolean, message: string, data?: any | IResolve): IResolve;

  // Actual implementation that handles both cases
  public static response(arg1: boolean | IResolve, message?: string, data?: any | IResolve, callerInfo?: string): IResolve {
    let result: IResolve;

    if (typeof arg1 === 'boolean') {
      // Case 1: Called with individual parameters
      result = {
        success: arg1,
        message: message as string, // Cast message as it's required in this case
        data: data
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
