import { useCallback, useMemo, useState } from "react";
import { CreditApi, CreditDetail, UpdateCreditPayload } from "@/lib/credit-api";
export type { CreditRenewCycle } from "@/lib/credit-api";

// Types now imported from lib

export function useCredit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CreditDetail | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CreditApi.getDetail();
      setDetail(data || {});
      return data || {};
    } catch (e: any) {
      const msg = e?.message || "Failed to load credit detail";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExtraction = useCallback(
    async (ownerId: string, payload: UpdateCreditPayload) => {
      if (!ownerId) throw new Error("ownerId is required");
      setLoading(true);
      setError(null);
      try {
        await CreditApi.updateExtraction(ownerId, payload);
      } catch (e: any) {
        const msg = e?.message || "Failed to update extraction credit";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateResearch = useCallback(
    async (ownerId: string, payload: UpdateCreditPayload) => {
      if (!ownerId) throw new Error("ownerId is required");
      setLoading(true);
      setError(null);
      try {
        await CreditApi.updateResearch(ownerId, payload);
      } catch (e: any) {
        const msg = e?.message || "Failed to update research credit";
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return useMemo(
    () => ({ loading, error, detail, fetchDetail, updateExtraction, updateResearch }),
    [loading, error, detail, fetchDetail, updateExtraction, updateResearch]
  );
}


