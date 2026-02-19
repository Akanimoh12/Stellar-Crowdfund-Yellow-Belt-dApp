import { useState, useCallback } from 'react';
import { donate } from '../services/contract';
import { AppError, AppErrorType, TransactionResult } from '../types';

export function useDonate() {
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const submitDonation = useCallback(async (publicKey: string, amount: number) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hash = await donate(publicKey, amount);
      setResult({ success: true, hash });
    } catch (err: any) {
      if (err.type) {
        // Already an AppError
        setError(err as AppError);
      } else {
        setError({
          type: AppErrorType.CONTRACT_ERROR,
          message: err.message || 'Donation failed',
        });
      }
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { submitDonation, result, loading, error, reset };
}
