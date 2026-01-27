import { useEffect, useState } from "react";
import { accountTypesApi, type AccountType } from "../utils/api";

const fallbackAccountTypes: AccountType[] = [
  { id: "fallback-wallet", type: "Wallet" },
  { id: "fallback-savings", type: "Savings" },
  { id: "fallback-credit", type: "Credit" },
  { id: "fallback-loans", type: "Loans" },
  { id: "fallback-investments", type: "Investments" },
  { id: "fallback-custom-other", type: "Custom - Other" },
];

let cachedAccountTypes: AccountType[] | null = null;

export function useAccountTypes() {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>(
    cachedAccountTypes || []
  );
  const [isLoading, setIsLoading] = useState(!cachedAccountTypes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedAccountTypes) {
      setAccountTypes(cachedAccountTypes);
      setIsLoading(false);
      return;
    }

    const fetchAccountTypes = async () => {
      setIsLoading(true);
      setError(null);
      const response = await accountTypesApi.getAll();

      if (response.success && response.data?.accountTypes?.length) {
        cachedAccountTypes = response.data.accountTypes;
        setAccountTypes(response.data.accountTypes);
      } else {
        setAccountTypes(fallbackAccountTypes);
        setError(response.error || "Failed to load account types");
      }

      setIsLoading(false);
    };

    fetchAccountTypes();
  }, []);

  return { accountTypes, isLoading, error };
}
