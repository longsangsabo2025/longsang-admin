/**
 * Circuit Breaker Service
 *
 * Implements circuit breaker pattern to prevent cascading failures
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening circuit
  resetTimeout?: number; // Milliseconds to wait before attempting reset
  monitoringWindow?: number; // Milliseconds for monitoring window
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringWindow: 60000, // 1 minute
};

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitStateData {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  lastResetAttempt: number;
}

class CircuitBreaker {
  private circuits: Map<string, CircuitStateData> = new Map();
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    circuitKey: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getCircuit(circuitKey);

    // Check circuit state
    if (circuit.state === 'open') {
      // Check if we should attempt reset
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime;
      if (timeSinceLastFailure >= this.options.resetTimeout) {
        circuit.state = 'half-open';
        circuit.successCount = 0;
      } else {
        throw new Error(
          `Circuit breaker is OPEN for ${circuitKey}. Too many failures.`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess(circuit);
      return result;
    } catch (error) {
      this.onFailure(circuit);
      throw error;
    }
  }

  /**
   * Get or create circuit state
   */
  private getCircuit(circuitKey: string): CircuitStateData {
    if (!this.circuits.has(circuitKey)) {
      this.circuits.set(circuitKey, {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        lastResetAttempt: 0,
      });
    }
    return this.circuits.get(circuitKey)!;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(circuit: CircuitStateData): void {
    if (circuit.state === 'half-open') {
      circuit.successCount++;
      // If we get a few successes in half-open, close the circuit
      if (circuit.successCount >= 2) {
        circuit.state = 'closed';
        circuit.failureCount = 0;
        circuit.successCount = 0;
      }
    } else {
      // Reset failure count on success in closed state
      circuit.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(circuit: CircuitStateData): void {
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'half-open') {
      // If we fail in half-open, open the circuit again
      circuit.state = 'open';
      circuit.successCount = 0;
    } else if (circuit.failureCount >= this.options.failureThreshold) {
      // Open the circuit if threshold reached
      circuit.state = 'open';
    }
  }

  /**
   * Get circuit state
   */
  getState(circuitKey: string): CircuitState {
    const circuit = this.getCircuit(circuitKey);
    return circuit.state;
  }

  /**
   * Reset circuit manually
   */
  reset(circuitKey: string): void {
    const circuit = this.getCircuit(circuitKey);
    circuit.state = 'closed';
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.lastFailureTime = 0;
  }

  /**
   * Get circuit statistics
   */
  getStats(circuitKey: string): {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number;
  } {
    const circuit = this.getCircuit(circuitKey);
    return {
      state: circuit.state,
      failureCount: circuit.failureCount,
      lastFailureTime: circuit.lastFailureTime,
    };
  }
}

// Export singleton instance
export const circuitBreaker = new CircuitBreaker();

export default circuitBreaker;

