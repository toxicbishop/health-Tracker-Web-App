import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { healthApi } from "../api/health";
import type { HealthLog } from "../types/health";
import { toast } from "sonner";

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const healthKeys = {
  all: ["health-logs"] as const,
  filtered: (type?: string) => [...healthKeys.all, { type }] as const,
};

// ─── Fetch all logs (optionally filtered by type) ───────────────────────────
export function useHealthLogs(type?: string): UseQueryResult<HealthLog[]> {
  return useQuery({
    queryKey: healthKeys.filtered(type),
    queryFn: () => healthApi.getLogs(type),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
}

// ─── Add a new health log with optimistic update ────────────────────────────
export function useAddHealthLog() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (log: Record<string, unknown>) => healthApi.addLog(log),

    onMutate: async (newLog) => {
      // Cancel any outgoing refetches so they don't overwrite
      await qc.cancelQueries({ queryKey: healthKeys.all });

      // Snapshot the previous values
      const previous = qc.getQueriesData<HealthLog[]>({ queryKey: healthKeys.all });

      // Optimistically add the new log everywhere
      qc.setQueriesData<HealthLog[]>(
        { queryKey: healthKeys.all },
        (old) => {
          if (!old) return old;
          const optimistic: HealthLog = {
            ...(newLog as unknown as HealthLog),
            id: `optimistic-${Date.now()}`,
          };
          return [...old, optimistic];
        }
      );

      return { previous };
    },

    onError: (_err, _newLog, context) => {
      // Roll back on error
      if (context?.previous) {
        context.previous.forEach(([key, data]) => {
          qc.setQueryData(key, data);
        });
      }
    },

    onSuccess: () => {
      toast.success("Health log saved successfully! ✅");
    },

    onSettled: () => {
      // Always refetch after success or error to sync with server
      qc.invalidateQueries({ queryKey: healthKeys.all });
    },
  });
}
