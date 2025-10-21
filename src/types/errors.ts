/**
 * Error Handling Types
 */

export type ErrorType = 'network' | 'api' | 'storage' | 'calculation' | 'validation';

export interface ErrorState {
  type: ErrorType;
  message: string;
  retryable: boolean;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: unknown;
}

export interface StorageError extends Error {
  quota?: number;
  used?: number;
  available?: number;
}

export interface CalculationError extends Error {
  tokenId?: string;
  timeframe?: number;
  inputData?: unknown;
}

export interface ValidationError extends Error {
  field?: string;
  value?: unknown;
  expectedType?: string;
}

export class CryptoAnalyzerError extends Error {
  public readonly type: ErrorType;
  public readonly retryable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(
    type: ErrorType,
    message: string,
    retryable: boolean = false,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CryptoAnalyzerError';
    this.type = type;
    this.retryable = retryable;
    this.context = context;
    this.timestamp = Date.now();
  }

  toErrorState(): ErrorState {
    return {
      type: this.type,
      message: this.message,
      retryable: this.retryable,
      timestamp: this.timestamp,
      context: this.context
    };
  }
}