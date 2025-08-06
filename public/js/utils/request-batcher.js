export class RequestBatcher {
    constructor(delay = 50) {
        this.delay = delay;
        this.pendingRequests = new Map();
        this.timeoutId = null;
    }

    // Add a request to the batch
    add(key, requestFn) {
        return new Promise((resolve, reject) => {
            // If there's already a request with this key, reject the previous one
            if (this.pendingRequests.has(key)) {
                const prev = this.pendingRequests.get(key);
                prev.reject(new Error('Request superseded by newer request'));
            }

            // Add the new request
            this.pendingRequests.set(key, { requestFn, resolve, reject });

            // Clear any existing timeout
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }

            // Set a new timeout to process the batch
            this.timeoutId = setTimeout(() => this.processBatch(), this.delay);
        });
    }

    // Process all pending requests
    async processBatch() {
        const requests = Array.from(this.pendingRequests.entries());
        this.pendingRequests.clear();

        // Execute all requests in parallel
        const promises = requests.map(async ([key, { requestFn, resolve, reject }]) => {
            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        // Wait for all requests to complete
        await Promise.allSettled(promises);
    }

    // Cancel all pending requests
    cancelAll() {
        for (const [key, { reject }] of this.pendingRequests) {
            reject(new Error('Request cancelled'));
        }
        this.pendingRequests.clear();
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

// Create a singleton instance for general use
export const requestBatcher = new RequestBatcher();