export class ApiBatcher {
    constructor() {
        this.pendingRequests = new Map();
        this.batchTimeout = 50; // ms to wait for batching
    }

    // Batch multiple API calls into a single request
    async batchRequest(endpoint, requests) {
        // Create a unique key for this batch
        const batchKey = `${endpoint}-${JSON.stringify(requests)}`;
        
        // If we already have a pending batch for this key, return the existing promise
        if (this.pendingRequests.has(batchKey)) {
            return this.pendingRequests.get(batchKey);
        }

        // Create a new batch promise
        const batchPromise = new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    // Remove from pending requests
                    this.pendingRequests.delete(batchKey);
                    
                    // Make the actual batch request
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ requests })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Batch request failed: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, this.batchTimeout);
        });

        // Store the promise for this batch
        this.pendingRequests.set(batchKey, batchPromise);
        
        return batchPromise;
    }

    // Add a request to a batch
    addRequest(batchId, method, url, data = null) {
        if (!this.pendingRequests.has(batchId)) {
            this.pendingRequests.set(batchId, []);
        }
        
        this.pendingRequests.get(batchId).push({
            method,
            url,
            data
        });
    }

    // Execute a batch of requests
    async executeBatch(batchId, endpoint = '/api/batch') {
        if (!this.pendingRequests.has(batchId)) {
            return [];
        }

        const requests = this.pendingRequests.get(batchId);
        this.pendingRequests.delete(batchId);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requests })
            });

            if (!response.ok) {
                throw new Error(`Batch request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Batch request error:', error);
            throw error;
        }
    }
}

// Create a singleton instance
export const apiBatcher = new ApiBatcher();