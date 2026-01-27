import { ErrorType } from "../../utils/errorMessages";

type ProviderOption = { id: string; label: string; accent: string };
type AccountTab = { value: string; label: string };

type Props = {
  isOpen: boolean;
  addAccountStep: "selectProvider" | "form";
  onBack: () => void;
  onClose: () => void;
  isLoadingAccountTypes: boolean;
  accountTypesError: string | null;
  addAccountTabs: AccountTab[];
  selectedAddType: string;
  onSelectAddType: (value: string) => void;
  visibleProviders: ProviderOption[];
  onSelectProvider: (provider: ProviderOption) => void;
  isCreatingCustomProvider: boolean;
  customProviderLabel: string;
  onCustomProviderLabelChange: (value: string) => void;
  customProviderError: string | null;
  customProviderErrorType?: ErrorType;
  customProviderCanRetry: boolean;
  onCreateCustomProvider: () => void;
  isSavingCustomProvider: boolean;
  onStartCustomProvider: () => void;
  onCancelCustomProvider: () => void;
  selectedProvider: ProviderOption | null;
  accountName: string;
  onAccountNameChange: (value: string) => void;
  accountBalance: string;
  onAccountBalanceChange: (value: string) => void;
  accountAddToNetWorth: boolean;
  onToggleAddToNetWorth: () => void;
  isCustomAccount: boolean;
  onSubmitAccount: () => void;
};

export default function AddAccountModal({
  isOpen,
  addAccountStep,
  onBack,
  onClose,
  isLoadingAccountTypes,
  accountTypesError,
  addAccountTabs,
  selectedAddType,
  onSelectAddType,
  visibleProviders,
  onSelectProvider,
  isCreatingCustomProvider,
  customProviderLabel,
  onCustomProviderLabelChange,
  customProviderError,
  customProviderErrorType,
  customProviderCanRetry,
  onCreateCustomProvider,
  isSavingCustomProvider,
  onStartCustomProvider,
  onCancelCustomProvider,
  selectedProvider,
  accountName,
  onAccountNameChange,
  accountBalance,
  onAccountBalanceChange,
  accountAddToNetWorth,
  onToggleAddToNetWorth,
  isCustomAccount,
  onSubmitAccount,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4">
      <div className="w-full max-w-xl bg-gray-100 dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {addAccountStep === "form" ? (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Back to account list"
              >
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Add Account</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close add account">
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {addAccountStep === "selectProvider" && (
          <div className="px-6 pb-6">
            {isLoadingAccountTypes ? (
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Loading account types...</p>
            ) : accountTypesError ? (
              <p className="mb-3 text-sm text-yellow-700 dark:text-yellow-300">
                Using default account types. Some options may be limited.
              </p>
            ) : null}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-2 flex gap-2 mb-5 overflow-x-auto">
              {addAccountTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => onSelectAddType(tab.value)}
                  className={[
                    "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap",
                    selectedAddType === tab.value
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-4 max-h-[420px] overflow-y-auto">
              <div className="space-y-3">
                {visibleProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => onSelectProvider(provider)}
                    className="w-full flex items-center gap-3 bg-gray-100 dark:bg-gray-600 rounded-2xl px-4 py-3 text-left hover:bg-white dark:hover:bg-gray-500"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${provider.accent}`}>
                      {provider.label.split(" ")[0][0]}
                    </div>
                    <span className="text-base text-gray-800 dark:text-gray-200">{provider.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              {isCreatingCustomProvider ? (
                <div className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Custom account name</label>
                  <input
                    type="text"
                    value={customProviderLabel}
                    onChange={(event) => onCustomProviderLabelChange(event.target.value)}
                    placeholder="e.g., My Custom Account"
                    className="w-full text-base text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none bg-transparent"
                  />
                  {customProviderError ? (
                    <div
                      className={`p-3 rounded-lg ${
                        customProviderErrorType === ErrorType.NETWORK || customProviderErrorType === ErrorType.SERVER
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p
                          className={`text-sm font-medium ${
                            customProviderErrorType === ErrorType.NETWORK || customProviderErrorType === ErrorType.SERVER
                              ? "text-yellow-800 dark:text-yellow-200"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {customProviderError}
                        </p>
                        {customProviderCanRetry && (
                          <button
                            type="button"
                            onClick={onCreateCustomProvider}
                            className="ml-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onCreateCustomProvider}
                      disabled={!customProviderLabel.trim() || isSavingCustomProvider}
                      className="px-4 py-2 rounded-xl bg-lime-300 dark:bg-lime-600 text-gray-900 dark:text-gray-100 text-sm font-semibold disabled:opacity-60"
                    >
                      {isSavingCustomProvider ? "Saving..." : "Create Account"}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelCustomProvider}
                      className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onStartCustomProvider}
                  className="w-full px-4 py-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Add custom account
                </button>
              )}
            </div>
          </div>
        )}

        {addAccountStep === "form" && (
          <div className="px-6 pb-8">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-4 flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                  selectedProvider?.accent || "bg-gray-400"
                }`}
              >
                {selectedProvider?.label?.split(" ")[0][0] || "A"}
              </div>
              <span className="text-base text-gray-800 dark:text-gray-200">
                {selectedProvider?.label || "Selected Account"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {isCustomAccount ? "Account name" : `${selectedAddType} name`}
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(event) => onAccountNameChange(event.target.value)}
                  placeholder={selectedAddType === "Wallet" ? "Daily Expenses" : "Account name"}
                  className="w-full text-base text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none bg-transparent"
                />
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 p-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current account balance
                </label>
                <div className="flex items-center gap-2 text-base text-gray-800 dark:text-gray-100">
                  <span>₱</span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(event) => onAccountBalanceChange(event.target.value)}
                    placeholder="0.00"
                    className="w-full focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add to Total Net Worth</span>
                <button
                  type="button"
                  onClick={onToggleAddToNetWorth}
                  className={[
                    "px-4 py-1.5 rounded-full text-sm font-semibold",
                    accountAddToNetWorth
                      ? "bg-lime-200 dark:bg-lime-600/40 text-lime-900 dark:text-lime-200"
                      : "bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500",
                  ].join(" ")}
                >
                  {accountAddToNetWorth ? "Yes" : "No"}
                </button>
              </div>
              <button
                onClick={onSubmitAccount}
                className="w-full bg-lime-300 dark:bg-lime-600 text-gray-900 dark:text-gray-100 text-base font-semibold rounded-2xl py-3 hover:bg-lime-400 dark:hover:bg-lime-500 disabled:opacity-60 disabled:cursor-not-allowed"
                type="button"
                disabled={!accountName.trim()}
              >
                Add Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
