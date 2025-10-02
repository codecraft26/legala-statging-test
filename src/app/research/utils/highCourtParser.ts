export interface ParsedHighCourtDetails {
  case_details?: {
    filing_number?: string;
    filing_date?: string;
    registration_number?: string;
    registration_date?: string;
    cnr_number?: string;
  };
  case_status?: {
    first_hearing_date?: string;
    decision_date?: string;
    stage_of_case?: string;
    nature_of_disposal?: string;
    coram?: string;
    judicial_branch?: string;
    not_before_me?: string;
    next_hearing_date?: string;
  };
  petitioner_and_advocate?: string[];
  respondent_and_advocate?: string[];
  orders?: Array<{
    order_number?: string;
    case_no?: string;
    judge?: string;
    order_date?: string;
    order_details?: string;
  }>;
  ia_details?: Array<{
    ia_number?: string;
    party?: string;
    date_of_filing?: string;
    next_date?: string;
    ia_status?: string;
  }>;
}

// Parse High Court HTML details into structured object expected by the UI
export function parseHighCourtHtml(html: string): ParsedHighCourtDetails {
  try {
    const container = document.createElement("div");
    container.innerHTML = html;

    const getCellAfterLabel = (tableSelector: string, label: string): string => {
      const table = container.querySelector(tableSelector);
      if (!table) return "";
      const tds = Array.from(table.querySelectorAll("td"));
      for (let i = 0; i < tds.length - 1; i++) {
        const labelText = tds[i].textContent?.replace(/\s+/g, " ").trim() || "";
        if (labelText.toLowerCase().includes(label.toLowerCase())) {
          return (tds[i + 1].textContent || "").trim();
        }
      }
      return "";
    };

    // Case details table (first table under "Case Details")
    const case_details = {
      filing_number: getCellAfterLabel(".case_details_table", "Filing Number") || "",
      filing_date: getCellAfterLabel(".case_details_table", "Filing Date") || "",
      registration_number:
        getCellAfterLabel(".case_details_table", "Registration Number") || "",
      registration_date:
        getCellAfterLabel(".case_details_table", "Registration Date") || "",
      cnr_number: (container.querySelector(".case_details_table tr strong")?.textContent || "").trim() || "",
    };

    // Case Status table (after "Case Status")
    const statusTable = Array.from(container.querySelectorAll("table")).find((t) =>
      /Case Status/i.test(t.previousElementSibling?.textContent || "")
    );
    const statusRows = statusTable ? Array.from(statusTable.querySelectorAll("tr")) : [];
    const statusMap: Record<string, string> = {};
    statusRows.forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length >= 2) {
        const key = (cells[0].textContent || "").replace(/\s+/g, " ").trim();
        const value = (cells[1].textContent || "").replace(/\s+/g, " ").trim();
        statusMap[key.toLowerCase()] = value;
      }
    });
    const case_status = {
      first_hearing_date: statusMap["first hearing date"] || "",
      decision_date: statusMap["decision date"] || "",
      stage_of_case: statusMap["case status"] || "",
      nature_of_disposal: statusMap["nature of disposal"] || "",
      coram: statusMap["coram"] || "",
      judicial_branch: statusMap["judicial branch"] || "",
      not_before_me: statusMap["not before me"] || "",
      next_hearing_date: statusMap["next hearing date"] || "",
    };

    // Parties and advocates
    const petitionerSpan = container.querySelector(".Petitioner_Advocate_table");
    const respondentSpan = container.querySelector(".Respondent_Advocate_table");
    const petitioner_and_advocate = petitionerSpan
      ? (petitionerSpan.textContent || "")
          .split(/\n|<br\s*\/?>(?=\s*)/gi as any)
          .map((s) => String(s).trim())
          .filter(Boolean)
      : [];
    const respondent_and_advocate = respondentSpan
      ? (respondentSpan.textContent || "")
          .split(/\n|<br\s*\/?>(?=\s*)/gi as any)
          .map((s) => String(s).trim())
          .filter(Boolean)
      : [];

    // Orders table
    const ordersHeader = Array.from(container.querySelectorAll("h2")).find((h) =>
      /Orders/i.test(h.textContent || "")
    );
    const ordersTable = ordersHeader?.parentElement?.nextElementSibling as HTMLTableElement | null;
    const orders: ParsedHighCourtDetails["orders"] = [];
    if (ordersTable) {
      const rows = Array.from(ordersTable.querySelectorAll("tr")).slice(1);
      rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length >= 5) {
          const link = tds[4].querySelector("a") as HTMLAnchorElement | null;
          orders.push({
            order_number: (tds[0].textContent || "").trim(),
            case_no: (tds[1].textContent || "").trim(),
            judge: (tds[2].textContent || "").trim(),
            order_date: (tds[3].textContent || "").trim(),
            order_details: link?.href || "",
          });
        }
      });
    }

    // IA details table
    const iaHeader = Array.from(container.querySelectorAll("h2")).find((h) =>
      /IA Details/i.test(h.textContent || "")
    );
    const iaTable = iaHeader?.nextElementSibling as HTMLTableElement | null;
    const ia_details: ParsedHighCourtDetails["ia_details"] = [];
    if (iaTable) {
      const rows = Array.from(iaTable.querySelectorAll("tr")).slice(1);
      rows.forEach((tr) => {
        const tds = tr.querySelectorAll("td, th");
        if (tds.length >= 5) {
          ia_details.push({
            ia_number: (tds[0].textContent || "").replace(/\s+/g, " ").trim(),
            party: (tds[1].textContent || "").trim(),
            date_of_filing: (tds[2].textContent || "").trim(),
            next_date: (tds[3].textContent || "").trim(),
            ia_status: (tds[4].textContent || "").trim(),
          });
        }
      });
    }

    return {
      case_details,
      case_status,
      petitioner_and_advocate,
      respondent_and_advocate,
      orders,
      ia_details,
    };
  } catch (e) {
    console.warn("Failed to parse High Court HTML details:", e);
    return {};
  }
}


