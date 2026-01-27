import { useCallback, useEffect, useState } from "react";
import { categoriesApi, type Category } from "../utils/api";
import { ErrorType } from "../utils/errorMessages";

export type CategoryOption = {
  id: string;
  label: string;
  emoji?: string;
};

const fallbackCategories: CategoryOption[] = [
  { id: "balance-adjustment", label: "Balance Adjustment", emoji: "🔄" },
  { id: "family-support", label: "Family Support", emoji: "👨‍👩‍👧‍👦" },
  { id: "food-drinks", label: "Food and Drinks", emoji: "🍔" },
  { id: "gifts", label: "Gifts", emoji: "🎁" },
  { id: "grocery", label: "Grocery", emoji: "🛒" },
  { id: "insurance", label: "Insurance Payment", emoji: "☂️" },
  { id: "medicine", label: "Medicine", emoji: "💊" },
  { id: "night-out", label: "Night Out", emoji: "🍻" },
  { id: "pet", label: "Pet", emoji: "🐶" },
  { id: "rent", label: "Rent", emoji: "🏠" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "subscriptions", label: "Subscriptions", emoji: "🔔" },
  { id: "transportation", label: "Transportation", emoji: "🚗" },
  { id: "utilities", label: "Utilities", emoji: "💡" },
];

let cachedCategories: CategoryOption[] | null = null;

type UseCategoriesOptions = {
  enabled?: boolean;
};

const mapCategories = (categories: Category[]): CategoryOption[] =>
  categories.map((category) => ({
    id: category.id,
    label: category.label,
    emoji: category.emoji,
  }));

export function useCategories(options: UseCategoriesOptions = {}) {
  const isEnabled = options.enabled !== false;
  const [categories, setCategories] = useState<CategoryOption[]>(
    cachedCategories || fallbackCategories
  );
  const [isLoading, setIsLoading] = useState(isEnabled && !cachedCategories);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>();
  const [canRetry, setCanRetry] = useState(false);

  const refresh = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);
    const response = await categoriesApi.list();

    if (response.success && response.data?.categories?.length) {
      const mapped = mapCategories(response.data.categories);
      cachedCategories = mapped;
      setCategories(mapped);
      setError(null);
      setErrorType(undefined);
      setCanRetry(false);
    } else {
      setCategories(cachedCategories || fallbackCategories);
      setError(response.error || "Failed to load categories.");
      setErrorType(response.errorType);
      setCanRetry(response.canRetry || false);
    }

    setIsLoading(false);
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;
    if (cachedCategories) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }
    refresh();
  }, [isEnabled, refresh]);

  return { categories, isLoading, error, errorType, canRetry, refresh };
}
