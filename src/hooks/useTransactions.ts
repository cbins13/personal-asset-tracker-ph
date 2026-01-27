import { useCallback, useEffect, useState } from "react";
import { transactionsApi, type Transaction, type TransactionKind } from "../utils/api";
import { apiCache } from "../utils/apiCache";
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
  const buildEndpoint = useCallback(
    (params: { accountId?: string; kind?: TransactionKind; includeAccounts?: boolean }) => {
      const queryEntries = Object.entries({
        accountId: params.accountId,
        kind: params.kind,
        includeAccounts: params.includeAccounts ? "true" : undefined,
      }).flatMap(([key, value]) => (value ? [[key, value]] : []));
      const query = new URLSearchParams(queryEntries).toString();
      return `/transactions${query ? `?${query}` : ""}`;
    },
    []
  );
  const baseCacheKey = buildEndpoint({ accountId, kind, includeAccounts });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const refresh = useCallback(
    async (
      override?: Partial<UseTransactionsOptions>,
      refreshOptions?: { bypassCache?: boolean; showLoading?: boolean }
    ) => {
      if (!isEnabled) return;
      const showLoading = refreshOptions?.showLoading !== false;
      const resolved = {
        accountId: override?.accountId ?? accountId,
        kind: override?.kind ?? kind,
        includeAccounts: override?.includeAccounts ?? includeAccounts,
      };
      const cacheKey = buildEndpoint(resolved);
      if (refreshOptions?.bypassCache) {
        apiCache.invalidate(cacheKey);
      }
      if (showLoading) {
        setIsLoading(true);
      }
      const response = await transactionsApi.list(resolved);
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
      if (showLoading) {
        setIsLoading(false);
      }
    },
    [accountId, buildEndpoint, includeAccounts, isEnabled, kind]
  );

  useEffect(() => {
    if (!isEnabled) return;
    const cached = apiCache.get<{ transactions: Transaction[] }>(baseCacheKey);
    if (cached?.transactions) {
      setTransactions(cached.transactions);
      setIsLoading(false);
      refresh(undefined, { bypassCache: true, showLoading: false });
      return;
    }
    refresh();
  }, [isEnabled, refresh]);

  return { transactions, isLoading, error, errorType, canRetry, refresh };
}
