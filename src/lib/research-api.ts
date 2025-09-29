/**
 * Research API Client for Legal AI Backend
 * Provides access to Supreme Court, High Court, and District Court case search functionality
 */

import { getApiBaseUrl } from "./utils";

const API_BASE_URL = `${getApiBaseUrl()}/research`;

const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

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

      return await response.json();
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(`${API_BASE_URL}/high-court/case-detail`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

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
