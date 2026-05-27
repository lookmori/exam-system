"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { TooltipProvider } from "./ui/tooltip";
import { ConfirmProvider } from "./shared/confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
          <Toaster
            position="top-center"
            richColors
            closeButton
            duration={3000}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
