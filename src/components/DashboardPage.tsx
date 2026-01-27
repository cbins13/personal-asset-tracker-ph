import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { ErrorType } from "../utils/errorMessages";
import { sanitizeText } from "../utils/sanitize";
import logoSmall from "../assets/savvi_logo.png";
import AnimatedContentWrapper from "../effects/AnimatedContentWrapper";
import Sidebar from "./Sidebar";
import { useAccountTypes } from "../hooks/useAccountTypes";
import { useAccounts } from "../hooks/useAccounts";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import NetWorthDisplay from "./dashboard/NetWorthDisplay";
import AccountFilters from "./dashboard/AccountFilters";
import AccountsSection from "./dashboard/AccountsSection";
import TransactionsSection from "./dashboard/TransactionsSection";
import AddAccountModal from "./dashboard/AddAccountModal";
import EditAccountModal from "./dashboard/EditAccountModal";
import {
  accountsApi,
  transactionsApi,
  type Account,
  type ProvidersByType,
  type Transaction,
} from "../utils/api";
import AddTransactionModal, { type AddTransactionPayload } from "./transactions/AddTransactionModal";

const accountProvidersFallback: Record<string, { id: string; label: string; accent: string }[]> = {
  "Custom - Other": [],
  Wallet: [
    { id: "cash", label: "Cash on Hand", accent: "bg-green-500" },
    { id: "beep", label: "Beep - Wallet", accent: "bg-blue-900" },
    { id: "gcash", label: "GCash - Wallet", accent: "bg-blue-500" },
    { id: "gotyme", label: "GoTyme - Wallet", accent: "bg-cyan-500" },
    { id: "grabpay", label: "GrabPay - Wallet", accent: "bg-emerald-500" },
    { id: "joyride", label: "JoyRide Pay - Wallet", accent: "bg-indigo-600" },
    { id: "lazada", label: "Lazada - Wallet", accent: "bg-pink-500" },
    { id: "maya", label: "Maya - Wallet", accent: "bg-gray-900" },
  ],
  Savings: [
    { id: "bpi", label: "BPI - Savings", accent: "bg-red-500" },
    { id: "bdo", label: "BDO - Savings", accent: "bg-blue-600" },
    { id: "metrobank", label: "Metrobank - Savings", accent: "bg-indigo-700" },
    { id: "unionbank", label: "UnionBank - Savings", accent: "bg-orange-500" },
  ],
  Credit: [
    { id: "citi", label: "Citi - Credit", accent: "bg-blue-700" },
    { id: "bpi-credit", label: "BPI - Credit", accent: "bg-red-600" },
    { id: "bdo-credit", label: "BDO - Credit", accent: "bg-blue-500" },
  ],
  Loans: [
    { id: "atome", label: "Atome - Loan/Credit", accent: "bg-lime-300" },
    { id: "billease", label: "Billease - Loan/Credit", accent: "bg-blue-400" },
    { id: "cashalo", label: "Cashalo - Loan/Credit", accent: "bg-yellow-400" },
    { id: "cimb", label: "CIMB - Loan/Credit", accent: "bg-red-500" },
    { id: "gcash-loan", label: "GCash - Loan/Credit", accent: "bg-blue-500" },
    { id: "gotyme-loan", label: "GoTyme - Loan/Credit", accent: "bg-cyan-500" },
    { id: "homecredit", label: "Home Credit - Loan/Credit", accent: "bg-red-400" },
  ],
  Investments: [
    { id: "mp2", label: "MP2 - Investments", accent: "bg-indigo-600" },
    { id: "col", label: "COL - Investments", accent: "bg-gray-700" },
    { id: "gcash-invest", label: "GCash - Investments", accent: "bg-blue-500" },
  ],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { accountTypes, isLoading: isLoadingAccountTypes, error: accountTypesError } = useAccountTypes();
  const user = auth.user;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isNetWorthHidden, setIsNetWorthHidden] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [addAccountStep, setAddAccountStep] = useState<"selectProvider" | "form">("selectProvider");
  const [selectedAddType, setSelectedAddType] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; label: string; accent: string } | null>(
    null
  );
  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [accountAddToNetWorth, setAccountAddToNetWorth] = useState(true);
  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [isCreatingCustomProvider, setIsCreatingCustomProvider] = useState(false);
  const [customProviderLabel, setCustomProviderLabel] = useState("");
  const [customProviderError, setCustomProviderError] = useState<string | null>(null);
  const [customProviderErrorType, setCustomProviderErrorType] = useState<ErrorType | undefined>();
  const [customProviderCanRetry, setCustomProviderCanRetry] = useState(false);
  const [isSavingCustomProvider, setIsSavingCustomProvider] = useState(false);
  const [providersByType, setProvidersByType] = useState<ProvidersByType>({});
  const [isEditingAccountName, setIsEditingAccountName] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isDeletingTransactionId, setIsDeletingTransactionId] = useState<string | null>(null);
  const [transactionActionError, setTransactionActionError] = useState<string | null>(null);
  const [transactionActionErrorType, setTransactionActionErrorType] = useState<ErrorType | undefined>();
  const [transactionActionCanRetry, setTransactionActionCanRetry] = useState(false);
  const {
    accounts,
    isLoading: isLoadingAccounts,
    error: accountsError,
    errorType: accountsErrorType,
    canRetry: accountsCanRetry,
    refresh: refreshAccounts,
  } = useAccounts();
  const { categories } = useCategories();
  const {
    transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    errorType: transactionsErrorType,
    canRetry: transactionsCanRetry,
    refresh: refreshTransactions,
  } = useTransactions({ accountId: selectedAccountId || undefined, includeAccounts: true });

  const displayTransactionsError = transactionActionError || transactionsError;
  const displayTransactionsErrorType = transactionActionError ? transactionActionErrorType : transactionsErrorType;
  const displayTransactionsCanRetry = transactionActionError ? transactionActionCanRetry : transactionsCanRetry;

  const customAccountType = useMemo(
    () => accountTypes.find((type) => type.type === "Custom - Other"),
    [accountTypes]
  );
  const defaultAddType = useMemo(
    () => customAccountType?.type || accountTypes[0]?.type || "Custom - Other",
    [accountTypes, customAccountType]
  );
  const accountFilters = useMemo(
    () => ["All", ...accountTypes.map((type) => type.type)],
    [accountTypes]
  );
  const addAccountTabs = useMemo(
    () =>
      accountTypes.map((type) => ({
        value: type.type,
        label: type.type === "Custom - Other" ? "Custom" : type.type,
      })),
    [accountTypes]
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const filteredAccounts = useMemo(() => {
    if (activeFilter === "All") return accounts;
    return accounts.filter((account) => account.type === activeFilter);
  }, [accounts, activeFilter]);

  const visibleProviders = useMemo(
    () => providersByType[selectedAddType] || [],
    [providersByType, selectedAddType]
  );

  const netWorthTotal = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if (!account.addToNetWorth) return total;
        return total + (account.currentBalance || 0);
      }, 0),
    [accounts]
  );

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate({ to: "/login", search: { redirect: "/dashboard" } });
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect even if logout fails
      navigate({ to: "/login", search: { redirect: "/dashboard" } });
    }
  };

  const refreshProviders = async () => {
    const response = await accountsApi.getProviders();
    if (response.success && response.data?.providersByType) {
      setProvidersByType(response.data.providersByType);
    } else {
      setProvidersByType(accountProvidersFallback);
    }
  };

  useEffect(() => {
    refreshProviders();
  }, []);

  useEffect(() => {
    if (!selectedAddType && accountTypes.length) {
      setSelectedAddType(defaultAddType);
    }
  }, [accountTypes, defaultAddType, selectedAddType]);

  useEffect(() => {
    if (selectedAccount) {
      setEditAccountName(selectedAccount.accountName);
      setIsEditingAccountName(false);
    }
  }, [selectedAccount]);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const openAddAccount = () => {
    setIsAddAccountOpen(true);
    setAddAccountStep("selectProvider");
    setSelectedAddType(defaultAddType);
    setSelectedProvider(null);
    setIsCustomAccount(false);
    setIsCreatingCustomProvider(false);
    setCustomProviderLabel("");
    setCustomProviderError(null);
    setCustomProviderErrorType(undefined);
    setCustomProviderCanRetry(false);
  };

  const closeAddAccount = () => {
    setIsAddAccountOpen(false);
    setSelectedProvider(null);
    setAccountName("");
    setAccountBalance("");
    setAccountAddToNetWorth(true);
    setIsCustomAccount(false);
    setIsCreatingCustomProvider(false);
    setCustomProviderLabel("");
    setCustomProviderError(null);
    setCustomProviderErrorType(undefined);
    setCustomProviderCanRetry(false);
    setIsSavingCustomProvider(false);
  };

  const handleSelectProvider = (provider: { id: string; label: string; accent: string }) => {
    setSelectedProvider(provider);
    setIsCustomAccount(false);
    setAddAccountStep("form");
  };

  const handleCreateCustomProvider = async () => {
    if (!customProviderLabel.trim()) return;
    setIsSavingCustomProvider(true);
    setCustomProviderError(null);
    setCustomProviderErrorType(undefined);
    setCustomProviderCanRetry(false);
    const response = await accountsApi.createProvider({
      type: selectedAddType,
      providerLabel: customProviderLabel.trim(),
    });
    setIsSavingCustomProvider(false);
    if (!response.success) {
      setCustomProviderError(response.error || "Failed to create custom account.");
      setCustomProviderErrorType(response.errorType);
      setCustomProviderCanRetry(response.canRetry || false);
      return;
    }
    const provider = response.data?.provider;
    if (provider) {
      await refreshProviders();
      setSelectedProvider(provider);
      setIsCustomAccount(true);
      setAddAccountStep("form");
      setIsCreatingCustomProvider(false);
      setCustomProviderLabel("");
      setCustomProviderError(null);
      setCustomProviderErrorType(undefined);
      setCustomProviderCanRetry(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) return;
    const balanceValue = Number(accountBalance || 0);
    const effectiveType = selectedAddType;
    if (accountTypes.length && !accountTypes.some((type) => type.type === effectiveType)) {
      console.warn(`Unsupported account type selection: ${effectiveType}`);
      return;
    }
    const response = await accountsApi.create({
      accountName: accountName.trim(),
      type: effectiveType,
      currentBalance: Number.isNaN(balanceValue) ? 0 : balanceValue,
      addToNetWorth: accountAddToNetWorth,
      providerId: selectedProvider?.id,
      providerLabel: selectedProvider?.label,
    });
    if (response.success) {
      closeAddAccount();
      refreshAccounts();
    }
  };

  const handleUpdateAccountName = async () => {
    if (!selectedAccount || !editAccountName.trim()) return;
    const response = await accountsApi.update(selectedAccount.id, {
      accountName: editAccountName.trim(),
    });
    if (response.success) {
      setIsEditingAccountName(false);
      refreshAccounts();
    }
  };

  const handleToggleNetWorth = async (value: boolean) => {
    if (!selectedAccount) return;
    const response = await accountsApi.update(selectedAccount.id, { addToNetWorth: value });
    if (response.success) {
      refreshAccounts();
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    const confirmed = window.confirm("Delete this account?");
    if (!confirmed) return;
    const response = await accountsApi.delete(selectedAccount.id);
    if (response.success) {
      setSelectedAccountId(null);
      refreshAccounts();
    }
  };

  const getAccountLabel = (tx: Transaction) => {
    if (tx.transactionKind === "transfer") {
      const fromAccount =
        tx.fromAccount?.accountName ||
        accounts.find((account) => account.id === tx.fromAccountId)?.accountName ||
        tx.fromAccountId ||
        "Source";
      const toAccount =
        tx.toAccount?.accountName ||
        accounts.find((account) => account.id === tx.toAccountId)?.accountName ||
        tx.toAccountId ||
        "Destination";
      return sanitizeText(`${fromAccount} → ${toAccount}`);
    }
    return sanitizeText(
      tx.account?.accountName ||
        accounts.find((account) => account.id === tx.accountId)?.accountName ||
        tx.accountId ||
        "Account"
    );
  };

  const handleCreateTransaction = async (payload: AddTransactionPayload) => {
    const response = await transactionsApi.create(payload);
    if (!response.success) {
      throw new Error(response.error || "Failed to add transaction.");
    }
    setIsAddTransactionOpen(false);
    await refreshAccounts();
    await refreshTransactions();
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsEditTransactionOpen(true);
  };

  const handleUpdateTransaction = async (transactionId: string, payload: AddTransactionPayload) => {
    const response = await transactionsApi.update(transactionId, payload);
    if (!response.success) {
      throw new Error(response.error || "Failed to update transaction.");
    }
    setIsEditTransactionOpen(false);
    setTransactionToEdit(null);
    await refreshAccounts();
    await refreshTransactions();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Delete this transaction? This will update account balances.")) {
      return;
    }
    setIsDeletingTransactionId(transactionId);
    const response = await transactionsApi.delete(transactionId);
    if (!response.success) {
      setTransactionActionError(response.error || "Failed to delete transaction.");
      setTransactionActionErrorType(response.errorType);
      setTransactionActionCanRetry(response.canRetry || false);
    } else {
      setTransactionActionError(null);
      setTransactionActionErrorType(undefined);
      setTransactionActionCanRetry(false);
      await refreshAccounts();
      await refreshTransactions();
    }
    setIsDeletingTransactionId(null);
  };

  const handleTransactionsRetry = () => {
    setTransactionActionError(null);
    setTransactionActionErrorType(undefined);
    setTransactionActionCanRetry(false);
    refreshTransactions();
  };

  const getProviderMeta = (account: Account) => {
    if (!account.providerId) return null;
    const providers = providersByType[account.type] || [];
    return providers.find((provider) => provider.id === account.providerId) || null;
  };

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // User should always be available here since route is protected
  if (auth.isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar (only for authenticated users) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center md:hidden">
                <Link to="/" className="inline-flex items-center gap-2">
                  <img
                    src={logoSmall}
                    alt="Savvi"
                    className="h-[100px] w-[100px]"
                  />
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Savvi</span>
                </Link>
              </div>
              <nav className="relative ml-auto flex items-center">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-transform duration-150 hover:scale-105 hover:shadow-md"
                  aria-label="Open profile menu"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {(user?.name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-20 animate-fade-in-down">
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      Signed in as
                      <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      type="button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </header>

      {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
          <AnimatedContentWrapper delay={0.05} duration={0.8}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedAccount ? (
                  <button
                    onClick={() => setSelectedAccountId(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Back to accounts"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : null}
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAccount
                    ? `${sanitizeText(selectedAccount.providerLabel || selectedAccount.accountName)} - ${sanitizeText(selectedAccount.type)}`
                    : "Accounts"}
                </h1>
              </div>
            </div>

            {!selectedAccount && (
              <>
                <NetWorthDisplay
                  netWorthTotal={netWorthTotal}
                  isHidden={isNetWorthHidden}
                  onToggle={() => setIsNetWorthHidden((prev) => !prev)}
                />

                <AccountFilters
                  filters={accountFilters}
                  activeFilter={activeFilter}
                  onChange={setActiveFilter}
                />

                <AccountsSection
                  filteredAccounts={filteredAccounts}
                  isLoading={isLoadingAccounts}
                  error={accountsError}
                  errorType={accountsErrorType}
                  canRetry={accountsCanRetry}
                  onRetry={refreshAccounts}
                  onSelectAccount={setSelectedAccountId}
                  getProviderMeta={getProviderMeta}
                  onAddAccount={openAddAccount}
                />

                <div className="mt-8">
                  <TransactionsSection
                    transactions={recentTransactions}
                    isLoading={isLoadingTransactions}
                    error={displayTransactionsError}
                    errorType={displayTransactionsErrorType}
                    canRetry={displayTransactionsCanRetry}
                    onRetry={handleTransactionsRetry}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    isDeletingId={isDeletingTransactionId}
                    getAccountLabel={getAccountLabel}
                    showViewAll
                    showFooterAdd
                    onAddTransaction={() => setIsAddTransactionOpen(true)}
                  />
                </div>
              </>
            )}

            {selectedAccount && (
              <div className="space-y-6">
                <EditAccountModal
                  account={selectedAccount}
                  isEditingName={isEditingAccountName}
                  editName={editAccountName}
                  onEditNameChange={setEditAccountName}
                  onStartEdit={() => setIsEditingAccountName(true)}
                  onSaveName={handleUpdateAccountName}
                  onCancelEdit={() => {
                    setIsEditingAccountName(false);
                    setEditAccountName(selectedAccount.accountName);
                  }}
                  onToggleNetWorth={handleToggleNetWorth}
                  getProviderMeta={getProviderMeta}
                />

                <TransactionsSection
                  transactions={transactions}
                  isLoading={isLoadingTransactions}
                  error={displayTransactionsError}
                  errorType={displayTransactionsErrorType}
                  canRetry={displayTransactionsCanRetry}
                  onRetry={handleTransactionsRetry}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  isDeletingId={isDeletingTransactionId}
                  getAccountLabel={getAccountLabel}
                  showViewAll
                  showHeaderAdd
                  onAddTransaction={() => setIsAddTransactionOpen(true)}
                />

                <div className="flex justify-center">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-10 py-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </AnimatedContentWrapper>
        </main>
      </div>
      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        accounts={accounts}
        categories={categories}
        onClose={() => setIsAddTransactionOpen(false)}
        onCreate={handleCreateTransaction}
        defaultAccountId={selectedAccountId || undefined}
      />
      {transactionToEdit ? (
        <AddTransactionModal
          isOpen={isEditTransactionOpen}
          accounts={accounts}
          categories={categories}
          onClose={() => {
            setIsEditTransactionOpen(false);
            setTransactionToEdit(null);
          }}
          mode="edit"
          transaction={transactionToEdit}
          onUpdate={handleUpdateTransaction}
        />
      ) : null}

      <AddAccountModal
        isOpen={isAddAccountOpen}
        addAccountStep={addAccountStep}
        onBack={() => setAddAccountStep("selectProvider")}
        onClose={closeAddAccount}
        isLoadingAccountTypes={isLoadingAccountTypes}
        accountTypesError={accountTypesError}
        addAccountTabs={addAccountTabs}
        selectedAddType={selectedAddType}
        onSelectAddType={(value) => {
          setSelectedAddType(value);
          setIsCustomAccount(false);
          setIsCreatingCustomProvider(false);
          setCustomProviderLabel("");
          setCustomProviderError(null);
        }}
        visibleProviders={visibleProviders}
        onSelectProvider={handleSelectProvider}
        isCreatingCustomProvider={isCreatingCustomProvider}
        customProviderLabel={customProviderLabel}
        onCustomProviderLabelChange={setCustomProviderLabel}
        customProviderError={customProviderError}
        customProviderErrorType={customProviderErrorType}
        customProviderCanRetry={customProviderCanRetry}
        onCreateCustomProvider={handleCreateCustomProvider}
        isSavingCustomProvider={isSavingCustomProvider}
        onStartCustomProvider={() => setIsCreatingCustomProvider(true)}
        onCancelCustomProvider={() => {
          setIsCreatingCustomProvider(false);
          setCustomProviderLabel("");
          setCustomProviderError(null);
        }}
        selectedProvider={selectedProvider}
        accountName={accountName}
        onAccountNameChange={setAccountName}
        accountBalance={accountBalance}
        onAccountBalanceChange={setAccountBalance}
        accountAddToNetWorth={accountAddToNetWorth}
        onToggleAddToNetWorth={() => setAccountAddToNetWorth((prev) => !prev)}
        isCustomAccount={isCustomAccount}
        onSubmitAccount={handleAddAccount}
      />
    </div>
  );
}
