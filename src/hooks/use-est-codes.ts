import { useState, useEffect } from "react";

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
  const [estData, setEstData] = useState<EstCodeData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstCodes = async () => {
      try {
        const response = await fetch(
          "https://researchengineinh.infrahive.ai/cc/est-codes"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch EST codes");
        }

        const data: EstCodesResponse = await response.json();

        if (data.success) {
          setEstData(data.data);
        } else {
          throw new Error("API returned success: false");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEstCodes();
  }, []);

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
