import { useCallback, useEffect, useState } from "react";
import { transactionsApi, type Transaction, type TransactionKind } from "../utils/api";
import { ErrorType } from "../utils/errorMessages";

type UseTransactionsOptions = {
  accountId?: string;
  kind?: TransactionKind;
  includeAccounts?: boolean;
  enabled?: boolean;
};

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { accountId, kind, includeAccounts } = options;
  const isEnabled = options.enabled !== false;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const refresh = useCallback(
    async (override?: Partial<UseTransactionsOptions>) => {
      if (!isEnabled) return;
      setIsLoading(true);
      const response = await transactionsApi.list({
        accountId: override?.accountId ?? accountId,
        kind: override?.kind ?? kind,
        includeAccounts: override?.includeAccounts ?? includeAccounts,
      });
      if (!response.success) {
        setError(response.error || "Failed to load transactions.");
        setErrorType(response.errorType);
        setCanRetry(response.canRetry || false);
        setTransactions([]);
      } else {
        setTransactions(response.data?.transactions || []);
        setError(null);
        setErrorType(undefined);
        setCanRetry(false);
      }
      setIsLoading(false);
    },
    [accountId, includeAccounts, isEnabled, kind]
  );

  useEffect(() => {
    if (!isEnabled) return;
    refresh();
  }, [isEnabled, refresh]);

  return { transactions, isLoading, error, errorType, canRetry, refresh };
}
