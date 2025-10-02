import { Api } from "@/lib/api-client";

export type CreditRenewCycle = "MONTHLY" | "YEARLY" | "DAILY" | "WEEKLY";

export interface CreditDetail {
  extraction?: {
    credit?: number | null;
    defaultCredit?: number | null;
    renew?: CreditRenewCycle | null;
    remaining?: number | null;
  } | null;
  research?: {
    credit?: number | null;
    defaultCredit?: number | null;
    renew?: CreditRenewCycle | null;
    remaining?: number | null;
  } | null;
}

export interface UpdateCreditPayload {
  credit?: number | null;
  defaultCredit?: number | null;
  renew?: CreditRenewCycle | null;
}

export const CreditApi = {
  getDetail: async (): Promise<CreditDetail> => {
    const res = await Api.get<any>("/credit/detail", "no-store");
    return (res && (res.data ?? res)) as CreditDetail;
  },

  updateExtraction: async (
    ownerId: string,
    payload: UpdateCreditPayload
  ): Promise<void> => {
    if (!ownerId) throw new Error("ownerId is required");
    const qs = new URLSearchParams({ ownerId }).toString();
    await Api.patch(`/credit/extraction?${qs}`, payload as any);
  },

  updateResearch: async (
    ownerId: string,
    payload: UpdateCreditPayload
  ): Promise<void> => {
    if (!ownerId) throw new Error("ownerId is required");
    const qs = new URLSearchParams({ ownerId }).toString();
    await Api.patch(`/credit/research?${qs}`, payload as any);
  },
};
