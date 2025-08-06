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

    // Only log errors and important operations, not routine SQL success
    if (!result.success || (message && !message.includes('SQL query executed successfully'))) {
      if (!result.success) {
        // For failed operations, use beautified JSON
        console.log(`${message || 'Operation'}${callerInfo ? ` <${callerInfo}>` : ''}:`, result);
      } else {
        // For successful operations, use one-line JSON
        console.log(`${message || 'Operation'}${callerInfo ? ` <${callerInfo}>` : ''}: ${JSON.stringify(result)}`);
      }
    }

    return result;
  }
}
