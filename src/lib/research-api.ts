/**
 * Research API Client for Legal AI Backend
 * Provides access to Supreme Court, High Court, and District Court case search functionality
 */

import { getApiBaseUrl, getResearchApiBaseUrl, getCookie } from "./utils";
import { http } from "@/lib/http";

const API_BASE_URL = `${getApiBaseUrl()}/research`;
const RESEARCH_API_BASE_URL = getResearchApiBaseUrl();

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? getCookie("token") || "" : "";

  // Debug: Check if token exists (only in development)
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    if (!token) {
      console.warn(
        "Research API: No authentication token found in localStorage"
      );
    }
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Supreme Court API Client
export class SupremeCourtAPI {
  static async searchByParty(data: {
    party_type: string;
    party_name: string;
    year: number;
    party_status: string;
  }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supreme-court/search-party`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Normalize response like the example:
      // { status: 200, data: [{ "Serial Number": "1", "Diary Number": "1040/2024", ... }] }
      if (json && typeof json === "object" && Array.isArray(json.data)) {
        const list = json.data as any[];
        const normalized = list.map((item) => {
          const get = (k: string) =>
            item[k] ?? item[k.toLowerCase().replace(/ /g, "_")];
          return {
            serial_number: get("Serial Number") || "",
            diary_number: get("Diary Number") || "",
            case_number: get("Case Number") || "",
            petitioner_name: get("Petitioner Name") || "",
            respondent_name: get("Respondent Name") || "",
            status: get("Status") || "",
            action: get("Action") || "",
          };
        });
        return normalized;
      }

      // If backend already returns array or differently structured, pass through
      return json;
    } catch (error) {
      console.error("Error searching by party:", error);
      throw error;
    }
  }

  static async searchByDiary(data: { diary_no: number; year: number }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supreme-court/search-diary`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching by diary:", error);
      throw error;
    }
  }

  static async getCaseDetail(data: { diary_no: number; diary_year: number }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supreme-court/case-detail`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting case detail:", error);
      throw error;
    }
  }
}

// High Court API Client
export class HighCourtAPI {
  static async getCourts() {
    try {
      const response = await fetch(`${RESEARCH_API_BASE_URL}/hc/courts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON. This usually indicates an authentication or server error.");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
      throw error;
    }
  }

  static async getCourtInfo(courtName: string, benchName: string) {
    try {
      const response = await fetch(
        `${RESEARCH_API_BASE_URL}/hc/court-info?name=${encodeURIComponent(courtName)}&bench=${encodeURIComponent(benchName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON. This usually indicates an authentication or server error.");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("Error fetching court info:", error);
      throw error;
    }
  }

  static async searchCaseStatusByParty(data: {
    court_code: string;
    state_code: string;
    court_complex_code: string;
    petres_name: string;
    rgyear: string;
  }) {
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('court_code', data.court_code);
      formData.append('state_code', data.state_code);
      formData.append('court_complex_code', data.court_complex_code);
      formData.append('petres_name', data.petres_name);
      formData.append('rgyear', data.rgyear);

      const response = await fetch(`${RESEARCH_API_BASE_URL}/hc/case-status`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON. This usually indicates an authentication or server error.");
      }

      try {
        const result = JSON.parse(responseText);
        
        // Check for captcha error
        if (result.success === false && result.error && result.error.includes("Captcha")) {
          throw new Error("Server requires captcha verification. Please try again later or contact support.");
        }
        
        // Check for other API errors
        if (result.success === false && result.error) {
          throw new Error(`API Error: ${result.error}`);
        }
        
        return result;
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("Error searching case status by party:", error);
      throw error;
    }
  }
  static async searchByAdvocate(data: {
    court_code: number;
    state_code: number;
    court_complex_code: number;
    advocate_name: string;
    f: "P" | "R" | "Both";
  }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/high-court/search-advocate`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching by advocate:", error);
      throw error;
    }
  }

  static async searchByFilingNumber(data: {
    court_code: number;
    state_code: number;
    court_complex_code: number;
    case_no: number;
    rgyear: number;
  }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/high-court/search-filing-number`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching by filing number:", error);
      throw error;
    }
  }

  static async searchByParty(data: {
    court_code: number;
    state_code: number;
    court_complex_code: number;
    petres_name: string;
    rgyear: number;
    f: "BOTH" | "PENDING" | "DISPOSED";
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/high-court/search-party`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON. This usually indicates an authentication or server error.");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("Error searching by party:", error);
      throw error;
    }
  }

  static async getCaseDetail(data: {
    case_no: number;
    state_code: number;
    cino: string;
    court_code: number;
    national_court_code: string;
    dist_cd: number;
  }) {
    try {
      // Format payload according to backend expectations
      const payload = {
        case_no: String(data.case_no).trim(),
        state_code: String(data.state_code).trim(),
        cino: String(data.cino || "").trim(),
        court_code: String(data.court_code).trim(),
        national_court_code: String(data.national_court_code || "").trim(),
        dist_cd: String(data.dist_cd).trim(),
      } as const;

      // eslint-disable-next-line no-console
      console.warn("High Court Case Detail API call initiated");

      const response = await fetch(`${API_BASE_URL}/high-court/case-detail`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      // eslint-disable-next-line no-console
      console.warn("High Court API response received");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("High Court API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting high court case detail:", error);
      throw error;
    }
  }
}

// District Court API Client
export class DistrictCourtAPI {
  static async searchByParty(data: {
    district_name: string;
    litigant_name: string;
    reg_year: number;
    case_status: string;
    est_code: string;
  }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/district-court/search-party`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching by party:", error);
      throw error;
    }
  }

  static async getCaseDetail(data: { cino: string; district_name: string }) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/district-court/case-detail`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting case detail:", error);
      throw error;
    }
  }
}

// RBI API Client
export class RBIAPI {
  static async fetchRepo(category: string) {
    try {
      const body = new URLSearchParams();
      body.set("category", category);

      const { data } = await http.post(
        `${RESEARCH_API_BASE_URL}/rbi/repo`,
        body.toString(),
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return data;
    } catch (error) {
      console.error("Error fetching RBI repo:", error);
      throw error;
    }
  }

  static async fetchUpdates() {
    try {
      const { data } = await http.post(
        `${RESEARCH_API_BASE_URL}/rbi/updates`,
        undefined,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      return data;
    } catch (error) {
      console.error("Error fetching RBI updates:", error);
      throw error;
    }
  }
}

// Research Management API Client
export class ResearchAPI {
  static async followResearch(data: {
    court: "Supreme_Court" | "High_Court" | "District_Court";
    followed: any;
    workspaceId: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error following research:", error);
      throw error;
    }
  }

  static async unfollowResearch(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/unfollow?id=${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error unfollowing research:", error);
      throw error;
    }
  }

  static async getFollowedResearch(workspaceId: string, court: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/followed?workspaceId=${workspaceId}&court=${court}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting followed research:", error);
      throw error;
    }
  }
}

// Error handling utility
export interface APIError {
  status: number;
  message: string;
  details?: any;
}

export const handleAPIError = (error: any) => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  } else if (error.status === 403) {
    // Insufficient credits
    alert("Insufficient credits for this operation");
  } else if (error.status === 429) {
    // Rate limited
    alert("Too many requests. Please try again later.");
  } else {
    // Other errors
    console.error("API Error:", error);
  }
};