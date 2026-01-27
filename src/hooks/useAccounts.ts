import { useCallback, useEffect, useState } from "react";
import { accountsApi, type Account } from "../utils/api";
import { ErrorType } from "../utils/errorMessages";

type UseAccountsOptions = {
  enabled?: boolean;
};

export function useAccounts(options: UseAccountsOptions = {}) {
  const isEnabled = options.enabled !== false;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const refresh = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);
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
    setIsLoading(false);
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    refresh();
  }, [isEnabled, refresh]);

  return { accounts, isLoading, error, errorType, canRetry, refresh };
}
