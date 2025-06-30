import logger from './logger';
import { performance } from 'perf_hooks';

/**
 * Performance Monitoring Utilities
 * Provides performance tracking and monitoring capabilities
 */

export interface PerformanceMetrics {
    operation: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    metadata?: any;
}

export class PerformanceMonitor {
    private static metrics: PerformanceMetrics[] = [];
    private static readonly MAX_METRICS = 1000; // Keep only last 1000 metrics

    /**
     * Measure execution time of a function
     */
    static async measureAsync<T>(
        operation: string,
        fn: () => Promise<T>,
        metadata?: any
    ): Promise<T> {
        const startTime = performance.now();
        let success = false;
        
        try {
            logger.debug(`Starting performance measurement: ${operation}`, metadata);
            const result = await fn();
            success = true;
            return result;
        } catch (error) {
            logger.warn(`Performance measurement failed: ${operation}`, { error, metadata });
            throw error;
        } finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordMetric({
                operation,
                duration,
                timestamp: new Date(),
                success,
                metadata
            });
            
            logger.debug(`Performance measurement completed: ${operation}`, {
                duration: `${duration.toFixed(2)}ms`,
                success,
                metadata
            });
        }
    }

    /**
     * Measure execution time of a synchronous function
     */
    static measure<T>(
        operation: string,
        fn: () => T,
        metadata?: any
    ): T {
        const startTime = performance.now();
        let success = false;
        
        try {
            logger.debug(`Starting performance measurement: ${operation}`, metadata);
            const result = fn();
            success = true;
            return result;
        } catch (error) {
            logger.warn(`Performance measurement failed: ${operation}`, { error, metadata });
            throw error;
        } finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordMetric({
                operation,
                duration,
                timestamp: new Date(),
                success,
                metadata
            });
            
            logger.debug(`Performance measurement completed: ${operation}`, {
                duration: `${duration.toFixed(2)}ms`,
                success,
                metadata
            });
        }
    }

    /**
     * Create a timer for manual measurement
     */
    static startTimer(operation: string, metadata?: any): PerformanceTimer {
        return new PerformanceTimer(operation, metadata);
    }

    /**
     * Record a performance metric
     */
    private static recordMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);
        
        // Keep only the most recent metrics
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Log slow operations
        if (metric.duration > 1000) { // > 1 second
            logger.warn(`Slow operation detected: ${metric.operation}`, {
                duration: `${metric.duration.toFixed(2)}ms`,
                metadata: metric.metadata
            });
        }
    }

    /**
     * Get performance statistics
     */
    static getStats(operation?: string): {
        totalOperations: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
        successRate: number;
        recentMetrics: PerformanceMetrics[];
    } {
        const filteredMetrics = operation 
            ? this.metrics.filter(m => m.operation === operation)
            : this.metrics;

        if (filteredMetrics.length === 0) {
            return {
                totalOperations: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                successRate: 0,
                recentMetrics: []
            };
        }

        const durations = filteredMetrics.map(m => m.duration);
        const successes = filteredMetrics.filter(m => m.success).length;

        return {
            totalOperations: filteredMetrics.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            successRate: (successes / filteredMetrics.length) * 100,
            recentMetrics: filteredMetrics.slice(-10) // Last 10 metrics
        };
    }

    /**
     * Clear all metrics
     */
    static clearMetrics(): void {
        this.metrics = [];
        logger.debug('Performance metrics cleared');
    }

    /**
     * Get all unique operation names
     */
    static getOperationNames(): string[] {
        return [...new Set(this.metrics.map(m => m.operation))];
    }
}

/**
 * Manual performance timer
 */
export class PerformanceTimer {
    private startTime: number;
    private operation: string;
    private metadata?: any;

    constructor(operation: string, metadata?: any) {
        this.operation = operation;
        this.metadata = metadata;
        this.startTime = performance.now();
        logger.debug(`Timer started: ${operation}`, metadata);
    }

    /**
     * Stop the timer and record the metric
     */
    stop(success: boolean = true): number {
        const endTime = performance.now();
        const duration = endTime - this.startTime;

        PerformanceMonitor['recordMetric']({
            operation: this.operation,
            duration,
            timestamp: new Date(),
            success,
            metadata: this.metadata
        });

        logger.debug(`Timer stopped: ${this.operation}`, {
            duration: `${duration.toFixed(2)}ms`,
            success,
            metadata: this.metadata
        });

        return duration;
    }
}

/**
 * Decorator for automatic performance measurement
 */
export function measurePerformance(operation?: string) {
    return function<T extends any[], R>(
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R> | R>
    ) {
        const originalMethod = descriptor.value;
        const operationName = operation || `${target.constructor.name}.${propertyKey}`;
        
        if (!originalMethod) {
            throw new Error('Method not found');
        }
        
        descriptor.value = function(...args: T): Promise<R> | R {
            const result = originalMethod.apply(this, args);
            
            if (result instanceof Promise) {
                return PerformanceMonitor.measureAsync(operationName, async () => result);
            } else {
                return PerformanceMonitor.measure(operationName, () => result);
            }
        } as any;
        
        return descriptor;
    };
}
