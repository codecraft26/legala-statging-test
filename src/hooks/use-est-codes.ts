import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { getBackendBaseUrl } from "@/lib/utils";

export interface EstCodeData {
  [district: string]: {
    url: string;
    state: string;
    est_codes: {
      [courtComplex: string]: string; // comma-separated EST codes
    };
  };
}

export interface EstCodeOption {
  code: string;
  description: string;
}

export interface EstCodesResponse {
  success: boolean;
  data: EstCodeData;
}

export function useEstCodes() {
  const ccBase = process.env.NEXT_PUBLIC_CC_BASE_URL || getBackendBaseUrl();

  const query = useQuery<{ [district: string]: any }, Error>({
    queryKey: ["est-codes", ccBase],
    queryFn: async () => {
      const { data } = await http.get<EstCodesResponse>(
        `${ccBase.replace(/\/$/, "")}/cc/est-codes`
      );
      if (!data?.success) throw new Error("Failed to load EST codes");
      return data.data as EstCodeData;
    },
    staleTime: 5 * 60 * 1000,
  });

  const estData: EstCodeData = query.data ?? {};
  const loading = query.isLoading || query.isFetching;
  const error = query.error?.message ?? null;

  const getEstCodeOptionsForDistrict = (
    districtName: string
  ): EstCodeOption[] => {
    if (!districtName || !estData[districtName.toLowerCase()]) {
      return [];
    }

    const districtData = estData[districtName.toLowerCase()];
    const options: EstCodeOption[] = [];

    Object.entries(districtData.est_codes).forEach(([courtComplex, codes]) => {
      const codeList = codes.split(",").map((code) => code.trim());
      codeList.forEach((code) => {
        if (code) {
          options.push({
            code,
            description: `${code} - ${courtComplex}`,
          });
        }
      });
    });

    return options.sort((a, b) => a.code.localeCompare(b.code));
  };

  const getDistrictNames = (): string[] => {
    return Object.keys(estData).sort();
  };

  const getStateForDistrict = (districtName: string): string => {
    if (!districtName || !estData[districtName.toLowerCase()]) {
      return "";
    }
    return estData[districtName.toLowerCase()].state;
  };

  return {
    estData,
    loading,
    error,
    getEstCodeOptionsForDistrict,
    getDistrictNames,
    getStateForDistrict,
  };
}
