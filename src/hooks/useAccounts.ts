import { useCallback, useEffect, useState } from "react";
import { accountsApi, type Account } from "../utils/api";
import { apiCache } from "../utils/apiCache";
import { ErrorType } from "../utils/errorMessages";

type UseAccountsOptions = {
  enabled?: boolean;
};

export function useAccounts(options: UseAccountsOptions = {}) {
  const isEnabled = options.enabled !== false;
  const cacheKey = "/accounts";
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const refresh = useCallback(async (refreshOptions?: { bypassCache?: boolean; showLoading?: boolean }) => {
    if (!isEnabled) return;
    const showLoading = refreshOptions?.showLoading !== false;
    if (refreshOptions?.bypassCache) {
      apiCache.invalidate(cacheKey);
    }
    if (showLoading) {
      setIsLoading(true);
    }
    const response = await accountsApi.getAll();
    if (!response.success) {
      setError(response.error || "Failed to load accounts.");
      setErrorType(response.errorType);
      setCanRetry(response.canRetry || false);
      setAccounts([]);
    } else {
      setAccounts(response.data?.accounts || []);
      setError(null);
      setErrorType(undefined);
      setCanRetry(false);
    }
    if (showLoading) {
      setIsLoading(false);
    }
  }, [cacheKey, isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    const cached = apiCache.get<{ accounts: Account[] }>(cacheKey);
    if (cached?.accounts) {
      setAccounts(cached.accounts);
      setIsLoading(false);
      refresh({ bypassCache: true, showLoading: false });
      return;
    }
    refresh();
  }, [isEnabled, refresh]);

  return { accounts, isLoading, error, errorType, canRetry, refresh };
}
