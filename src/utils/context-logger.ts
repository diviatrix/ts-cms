export class ContextLogger {
    private static isEnabled = true;
    
    static enable() {
        this.isEnabled = true;
    }
    
    static disable() {
        this.isEnabled = false;
    }
    
    static operation(module: string, action: string, target: string, result: 'SUCCESS' | 'ERROR' | 'DUPLICATE' | 'NOT_FOUND' | string, timing?: number, error?: string) {
        if (!this.isEnabled) return;
        
        const timeStr = timing ? ` (${timing}ms)` : '';
        const errorStr = error ? ` - ${error}` : '';
        const emoji = this.getEmoji(result);
        
        console.log(`${emoji} [${module}] ${action}: ${target} → ${result}${timeStr}${errorStr}`);
    }
    
    static api(method: string, path: string, status: number, timing?: number) {
        if (!this.isEnabled) return;
        
        const timeStr = timing ? ` (${timing}ms)` : '';
        const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
        
        console.log(`${emoji} [API] ${method} ${path} → ${status}${timeStr}`);
    }
    
    static db(operation: string, table: string, result: 'SUCCESS' | 'ERROR' | 'NOT_FOUND' | string, recordCount?: number) {
        if (!this.isEnabled) return;
        
        const countStr = recordCount !== undefined ? ` (${recordCount} records)` : '';
        const emoji = this.getEmoji(result);
        
        console.log(`${emoji} [DB] ${operation}(${table})${countStr} → ${result}`);
    }
    
    private static getEmoji(result: string): string {
        switch (result) {
            case 'SUCCESS': return '✅';
            case 'ERROR': return '❌';
            case 'DUPLICATE': return '🔄';
            case 'NOT_FOUND': return '🔍';
            default: return '⚠️';
        }
    }
}
