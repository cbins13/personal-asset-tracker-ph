import { ErrorType } from "../../utils/errorMessages";
import { formatCurrency } from "../../utils/formatters";
import { sanitizeText } from "../../utils/sanitize";
import type { Account } from "../../utils/api";

type ProviderMeta = { id: string; label: string; accent: string } | null;

type Props = {
  filteredAccounts: Account[];
  isLoading: boolean;
  error: string | null;
  errorType?: ErrorType;
  canRetry: boolean;
  onRetry: () => void;
  onSelectAccount: (accountId: string) => void;
  getProviderMeta: (account: Account) => ProviderMeta;
  onAddAccount: () => void;
};

export default function AccountsSection({
  filteredAccounts,
  isLoading,
  error,
  errorType,
  canRetry,
  onRetry,
  onSelectAccount,
  getProviderMeta,
  onAddAccount,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {isLoading ? (
        <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">Loading accounts...</div>
      ) : error ? (
        <div
          className={`col-span-full p-3 rounded-lg ${
            errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {error}
              </p>
            </div>
            {canRetry && (
              <button
                onClick={onRetry}
                className="ml-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">No accounts yet.</div>
      ) : (
        filteredAccounts.map((account) => {
          const providerMeta = getProviderMeta(account);
          const safeProviderLabel = providerMeta?.label ? sanitizeText(providerMeta.label) : undefined;
          const safeAccountName = sanitizeText(account.accountName || "");
          const safeProviderFallback = account.providerLabel ? sanitizeText(account.providerLabel) : undefined;
          const iconText =
            safeProviderLabel?.split(" ")[0][0] || safeProviderFallback?.[0] || safeAccountName?.[0] || "A";
          const iconAccent = providerMeta?.accent || "bg-gray-400";
          return (
            <button
              key={account.id}
              onClick={() => onSelectAccount(account.id)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${iconAccent}`}>
                  {iconText.toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{safeAccountName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {safeProviderFallback || sanitizeText(account.type)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.currentBalance || 0)}
              </p>
            </button>
          );
        })
      )}
      <button
        onClick={onAddAccount}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <span className="text-3xl">+</span>
        <span className="mt-2 text-sm font-medium">Add Account</span>
      </button>
    </div>
  );
}
