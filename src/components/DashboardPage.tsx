import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import logoSmall from "../assets/savvi_logo.png";
import AnimatedContent from "../effects/AnimatedContent";
import Sidebar from "./Sidebar";
import { accountsApi, transactionsApi, type Account, type ProvidersByType, type Transaction } from "../utils/api";

const accountFilters = ["All", "Wallet", "Savings", "Credit", "Loans", "Investments"];
const addAccountTabs = ["Wallet", "Savings", "Credit", "Loans", "Investments"];

const accountProvidersFallback: Record<string, { id: string; label: string; accent: string }[]> = {
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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isNetWorthHidden, setIsNetWorthHidden] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [addAccountStep, setAddAccountStep] = useState<"selectProvider" | "form">("selectProvider");
  const [selectedAddType, setSelectedAddType] = useState("Wallet");
  const [selectedProvider, setSelectedProvider] = useState<{ id: string; label: string; accent: string } | null>(
    null
  );
  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [accountAddToNetWorth, setAccountAddToNetWorth] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [providersByType, setProvidersByType] = useState<ProvidersByType>(accountProvidersFallback);
  const [isEditingAccountName, setIsEditingAccountName] = useState(false);
  const [editAccountName, setEditAccountName] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [transactionLabel, setTransactionLabel] = useState("");
  const [transactionDate, setTransactionDate] = useState("");

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

  const refreshAccounts = async () => {
    setIsLoadingAccounts(true);
    const response = await accountsApi.getAll();
    if (!response.success) {
      setAccountsError(response.error || "Failed to load accounts.");
      setAccounts([]);
    } else {
      setAccounts(response.data?.accounts || []);
      setAccountsError(null);
    }
    setIsLoadingAccounts(false);
  };

  const refreshProviders = async () => {
    const response = await accountsApi.getProviders();
    if (response.success && response.data?.providersByType) {
      setProvidersByType(response.data.providersByType);
    }
  };

  const fetchTransactions = async (accountId: string) => {
    setIsLoadingTransactions(true);
    const response = await transactionsApi.list(accountId);
    if (!response.success) {
      setTransactionsError(response.error || "Failed to load transactions.");
      setTransactions([]);
    } else {
      setTransactions(response.data?.transactions || []);
      setTransactionsError(null);
    }
    setIsLoadingTransactions(false);
  };

  useEffect(() => {
    refreshAccounts();
    refreshProviders();
  }, []);

  useEffect(() => {
    if (!selectedAccountId) {
      setTransactions([]);
      setTransactionsError(null);
      return;
    }
    fetchTransactions(selectedAccountId);
  }, [selectedAccountId]);

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
    setSelectedAddType("Wallet");
    setSelectedProvider(null);
  };

  const closeAddAccount = () => {
    setIsAddAccountOpen(false);
    setSelectedProvider(null);
    setAccountName("");
    setAccountBalance("");
    setAccountAddToNetWorth(true);
  };

  const handleSelectProvider = (provider: { id: string; label: string; accent: string }) => {
    setSelectedProvider(provider);
    setAddAccountStep("form");
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) return;
    const balanceValue = Number(accountBalance || 0);
    const response = await accountsApi.create({
      accountName: accountName.trim(),
      type: selectedAddType,
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

  const handleAddTransaction = async () => {
    if (!selectedAccount) return;
    const amountValue = Number(transactionAmount || 0);
    if (!amountValue || Number.isNaN(amountValue)) return;
    const response = await transactionsApi.create({
      accountId: selectedAccount.id,
      amount: amountValue,
      type: transactionType,
      label: transactionLabel.trim(),
      occurredAt: transactionDate ? new Date(transactionDate).toISOString() : undefined,
    });
    if (response.success) {
      setTransactionAmount("");
      setTransactionLabel("");
      setTransactionDate("");
      await refreshAccounts();
      await fetchTransactions(selectedAccount.id);
    }
  };

  const getProviderMeta = (account: Account) => {
    if (!account.providerId) return null;
    const providers = providersByType[account.type] || [];
    return providers.find((provider) => provider.id === account.providerId) || null;
  };

  // User should always be available here since route is protected
  if (auth.isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (only for authenticated users) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center md:hidden">
                <Link to="/" className="inline-flex items-center gap-2">
                  <img
                    src={logoSmall}
                    alt="Savvi"
                    className="h-[100px] w-[100px]"
                  />
                  <span className="text-lg font-semibold text-gray-900 tracking-tight">Savvi</span>
                </Link>
              </div>
              <nav className="relative ml-auto flex items-center">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-transform duration-150 hover:scale-105 hover:shadow-md"
                  aria-label="Open profile menu"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {(user?.name || user?.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 animate-fade-in-down">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Signed in as
                      <div className="font-medium text-gray-800 truncate">
                        {user?.email}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      type="button"
                    >
                      Settings
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
          <AnimatedContent delay={0.05} duration={0.8}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedAccount ? (
                  <button
                    onClick={() => setSelectedAccountId(null)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Back to accounts"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : null}
                <h1 className="text-2xl font-semibold text-gray-900">
                  {selectedAccount
                    ? `${selectedAccount.providerLabel || selectedAccount.accountName} - ${selectedAccount.type}`
                    : "Accounts"}
                </h1>
              </div>
            </div>

            {!selectedAccount && (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Net Worth</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {isNetWorthHidden ? "••••••" : formatCurrency(netWorthTotal)}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNetWorthHidden((prev) => !prev)}
                    className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    aria-label="Toggle net worth visibility"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mb-6">
                  {accountFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={[
                        "px-4 py-2 rounded-full text-sm font-medium border",
                        activeFilter === filter
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400",
                      ].join(" ")}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isLoadingAccounts ? (
                    <div className="col-span-full text-sm text-gray-500">Loading accounts...</div>
                  ) : accountsError ? (
                    <div className="col-span-full text-sm text-red-600">{accountsError}</div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="col-span-full text-sm text-gray-500">No accounts yet.</div>
                  ) : (
                    filteredAccounts.map((account) => {
                      const providerMeta = getProviderMeta(account);
                      const iconText =
                        providerMeta?.label?.split(" ")[0][0] ||
                        account.providerLabel?.[0] ||
                        account.accountName?.[0] ||
                        "A";
                      const iconAccent = providerMeta?.accent || "bg-gray-400";
                      return (
                        <button
                          key={account.id}
                          onClick={() => setSelectedAccountId(account.id)}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${iconAccent}`}
                            >
                              {iconText.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-900">
                                {account.accountName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {account.providerLabel || account.type}
                              </p>
                            </div>
                          </div>
                          <p className="mt-4 text-2xl font-bold text-gray-900">
                            {formatCurrency(account.currentBalance || 0)}
                          </p>
                        </button>
                      );
                    })
                  )}
                  <button
                    onClick={openAddAccount}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700"
                  >
                    <span className="text-3xl">+</span>
                    <span className="mt-2 text-sm font-medium">Add Account</span>
                  </button>
                </div>

                <div className="mt-8 flex justify-center">
                  <button className="px-8 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                    Change order
                  </button>
                </div>
              </>
            )}

            {selectedAccount && (
              <div className="space-y-6">
                <div className="bg-gray-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const providerMeta = getProviderMeta(selectedAccount);
                        const iconText =
                          providerMeta?.label?.split(" ")[0][0] ||
                          selectedAccount.providerLabel?.[0] ||
                          selectedAccount.accountName?.[0] ||
                          "A";
                        const iconAccent = providerMeta?.accent || "bg-gray-400";
                        return (
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold ${iconAccent}`}
                          >
                            {iconText.toUpperCase()}
                          </div>
                        );
                      })()}
                      <div>
                        {isEditingAccountName ? (
                          <input
                            value={editAccountName}
                            onChange={(event) => setEditAccountName(event.target.value)}
                            className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-600"
                          />
                        ) : (
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedAccount.accountName}
                          </p>
                        )}
                        <p className="mt-1 text-3xl font-bold text-gray-900">
                          {formatCurrency(selectedAccount.currentBalance || 0)}
                        </p>
                      </div>
                    </div>
                    {isEditingAccountName ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUpdateAccountName}
                          className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingAccountName(false);
                            setEditAccountName(selectedAccount.accountName);
                          }}
                          className="px-4 py-2 rounded-full border border-transparent text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingAccountName(true)}
                        className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Goal amount</p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {formatCurrency(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Interest rate</p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {"--"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-900 rounded-2xl px-6 py-4 text-white">
                    <p className="text-sm font-medium">Total Interest Earned</p>
                    <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-gray-300">Month</p>
                        <p className="mt-1 font-semibold">₱0.00</p>
                      </div>
                      <div>
                        <p className="text-gray-300">Year</p>
                        <p className="mt-1 font-semibold">₱0.00</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">Add to Total Net Worth?</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleNetWorth(true)}
                        className={[
                          "px-4 py-1.5 rounded-full text-sm font-semibold",
                          selectedAccount.addToNetWorth
                            ? "bg-lime-200 text-lime-900"
                            : "bg-white text-gray-600 border border-gray-300",
                        ].join(" ")}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleToggleNetWorth(false)}
                        className={[
                          "px-4 py-1.5 rounded-full text-sm font-semibold",
                          !selectedAccount.addToNetWorth
                            ? "bg-lime-200 text-lime-900"
                            : "bg-white text-gray-600 border border-gray-300",
                        ].join(" ")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={transactionLabel}
                      onChange={(event) => setTransactionLabel(event.target.value)}
                      placeholder="Label"
                      className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <input
                      type="number"
                      value={transactionAmount}
                      onChange={(event) => setTransactionAmount(event.target.value)}
                      placeholder="Amount"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <select
                      value={transactionType}
                      onChange={(event) => setTransactionType(event.target.value as "credit" | "debit")}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={transactionDate}
                      onChange={(event) => setTransactionDate(event.target.value)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <button
                      onClick={handleAddTransaction}
                      className="md:col-span-4 rounded-xl bg-gray-900 text-white text-sm font-semibold py-2 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                      type="button"
                      disabled={!transactionAmount}
                    >
                      Add Transaction
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {isLoadingTransactions ? (
                      <p className="text-sm text-gray-500">Loading transactions...</p>
                    ) : transactionsError ? (
                      <p className="text-sm text-red-600">{transactionsError}</p>
                    ) : transactions.length === 0 ? (
                      <p className="text-sm text-gray-500">No transactions yet.</p>
                    ) : (
                      transactions.map((tx) => {
                        const signedAmount = tx.type === "debit" ? -Math.abs(tx.amount) : tx.amount;
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                          >
                            <div>
                              <p className="text-sm text-gray-500">
                                {formatDateTime(tx.occurredAt || tx.createdAt)}
                              </p>
                              <p className="mt-1 text-base font-semibold text-gray-900">
                                {tx.label || "Transaction"}
                              </p>
                            </div>
                            <p
                              className={[
                                "text-base font-semibold",
                                signedAmount < 0 ? "text-red-500" : "text-emerald-600",
                              ].join(" ")}
                            >
                              {signedAmount < 0 ? "-" : ""}
                              {formatCurrency(Math.abs(signedAmount))}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-10 py-3 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </AnimatedContent>
        </main>
      </div>
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl bg-gray-100 rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-gray-100">
              <div className="flex items-center gap-3">
                {addAccountStep === "form" ? (
                  <button
                    onClick={() => setAddAccountStep("selectProvider")}
                    className="p-2 rounded-full hover:bg-gray-200"
                    aria-label="Back to account list"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : null}
                <h2 className="text-2xl font-semibold text-gray-900">Add Account</h2>
              </div>
              <button
                onClick={closeAddAccount}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Close add account"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addAccountStep === "selectProvider" && (
              <div className="px-6 pb-6">
                <div className="bg-gray-200 rounded-2xl p-2 flex gap-2 mb-5 overflow-x-auto">
                  {addAccountTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedAddType(tab)}
                      className={[
                        "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap",
                        selectedAddType === tab
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      ].join(" ")}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="bg-gray-200 rounded-2xl p-4 max-h-[420px] overflow-y-auto">
                  <div className="space-y-3">
                    {visibleProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleSelectProvider(provider)}
                        className="w-full flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3 text-left hover:bg-white"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${provider.accent}`}
                        >
                          {provider.label.split(" ")[0][0]}
                        </div>
                        <span className="text-base text-gray-800">{provider.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {addAccountStep === "form" && (
              <div className="px-6 pb-8">
                <div className="bg-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3 mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold ${
                      selectedProvider?.accent || "bg-gray-400"
                    }`}
                  >
                    {selectedProvider?.label?.split(" ")[0][0] || "A"}
                  </div>
                  <span className="text-base text-gray-800">
                    {selectedProvider?.label || "Selected Account"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {selectedAddType} name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(event) => setAccountName(event.target.value)}
                      placeholder={selectedAddType === "Wallet" ? "Daily Expenses" : "Account name"}
                      className="w-full text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current account balance
                    </label>
                    <div className="flex items-center gap-2 text-base text-gray-800">
                      <span>₱</span>
                      <input
                        type="number"
                        value={accountBalance}
                        onChange={(event) => setAccountBalance(event.target.value)}
                        placeholder="0.00"
                        className="w-full focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Add to Total Net Worth</span>
                    <button
                      type="button"
                      onClick={() => setAccountAddToNetWorth((prev) => !prev)}
                      className={[
                        "px-4 py-1.5 rounded-full text-sm font-semibold",
                        accountAddToNetWorth
                          ? "bg-lime-200 text-lime-900"
                          : "bg-white text-gray-600 border border-gray-300",
                      ].join(" ")}
                    >
                      {accountAddToNetWorth ? "Yes" : "No"}
                    </button>
                  </div>
                  <button
                    onClick={handleAddAccount}
                    className="w-full bg-lime-300 text-gray-900 text-base font-semibold rounded-2xl py-3 hover:bg-lime-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
      )}
    </div>
  );
}
