class CircuitBreaker {
    constructor(name, options = {}) {
        this.name = name;
        this.failureThreshold = options.failureThreshold || 5;
        this.cooldownPeriod = options.cooldownPeriod || 10000; // 10 seconds

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    async execute(action, fallback) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.cooldownPeriod) {
                this.state = 'HALF_OPEN';
                console.log(`[CircuitBreaker-${this.name}] Transitioned to HALF_OPEN. Probing service...`);
            } else {
                console.warn(`[CircuitBreaker-${this.name}] Circuit is OPEN. Failing fast.`);
                if (fallback) {
                    return typeof fallback === 'function' ? await fallback() : fallback;
                }
                throw new Error(`CircuitBreaker '${this.name}' is OPEN. Service temporarily unavailable.`);
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            if (fallback) {
                return typeof fallback === 'function' ? await fallback(error) : fallback;
            }
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            console.log(`[CircuitBreaker-${this.name}] Transitioned to CLOSED. Service fully recovered.`);
        }
    }

    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        console.error(`[CircuitBreaker-${this.name}] Failure #${this.failureCount}: ${error.message}`);

        if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.error(`[CircuitBreaker-${this.name}] Transitioned to OPEN. Service blocked.`);
        }
    }
}

// Instantiate core circuit breakers
const redisCircuit = new CircuitBreaker('Redis', { failureThreshold: 5, cooldownPeriod: 10000 });
const mongoCircuit = new CircuitBreaker('MongoDB', { failureThreshold: 5, cooldownPeriod: 10000 });
const sendGridCircuit = new CircuitBreaker('SendGrid', { failureThreshold: 3, cooldownPeriod: 15000 });
const aiCircuit = new CircuitBreaker('AIService', { failureThreshold: 3, cooldownPeriod: 15000 });

module.exports = {
    CircuitBreaker,
    redisCircuit,
    mongoCircuit,
    sendGridCircuit,
    aiCircuit
};
