import { createFileRoute, redirect } from "@tanstack/react-router";
import TransactionsPage from "../components/transactions/TransactionsPage";

export const Route = createFileRoute("/transactions")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: TransactionsPage,
});
