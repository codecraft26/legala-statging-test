// Utility functions to parse Supreme Court HTML responses into structured content

export type SupremeCourtCaseData = {
  [key: string]: {
    success: boolean;
    data: {
      data: string;
    };
  };
};

export const parseHtmlContent = (htmlString: string): any[][] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const tables = doc.querySelectorAll("table");
    const result: any[][] = [];

    if (tables.length > 0) {
      tables.forEach((table) => {
        const rows = table.querySelectorAll("tr");
        const tableData: any[][] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td, th");
          const rowData: any[] = [];

          cells.forEach((cell) => {
            const links = cell.querySelectorAll("a");
            if (links.length > 0) {
              const linkData: any[] = [];
              links.forEach((link) => {
                linkData.push({
                  text: link.textContent?.trim() || "",
                  href: (link as HTMLAnchorElement).href,
                  target: (link as HTMLAnchorElement).target,
                });
              });
              rowData.push({ type: "links", data: linkData });
            } else {
              rowData.push(cell.textContent?.trim() || "");
            }
          });

          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        });

        if (tableData.length > 0) {
          result.push(tableData);
        }
      });
    } else {
      const divs = doc.querySelectorAll("div, p, span");
      if (divs.length > 0) {
        const structuredData: any[][] = [];
        divs.forEach((div) => {
          const text = div.textContent?.trim();
          if (text && text.length > 0) {
            if (text.includes("\t") || text.includes("|")) {
              const parts = text.split(/\t|\|/).map((part) => part.trim());
              if (parts.length >= 2) structuredData.push(parts);
            } else if (text.includes(":")) {
              const parts = text.split(":").map((part) => part.trim());
              if (parts.length >= 2) structuredData.push(parts);
            } else {
              structuredData.push([text]);
            }
          }
        });
        if (structuredData.length > 0) result.push(structuredData);
      }
    }

    if (result.length === 0) {
      const textContent = doc.body.textContent?.trim();
      if (textContent) {
        const lines = textContent.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length > 0) {
          const textTable: any[][] = [];
          lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            if (trimmedLine.includes("\t")) {
              const parts = trimmedLine.split("\t").map((part) => part.trim());
              textTable.push(parts);
            } else if (trimmedLine.includes(":")) {
              const parts = trimmedLine.split(":").map((part) => part.trim());
              textTable.push(parts);
            } else {
              textTable.push([trimmedLine]);
            }
          });
          if (textTable.length > 0) result.push(textTable);
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing HTML:", error);
    return [[["Error parsing content"], [htmlString.substring(0, 200) + "..."]]];
  }
};

export const createSupremeCourtCaseData = (
  htmlString: string
): SupremeCourtCaseData => {
  try {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    const caseData: SupremeCourtCaseData = {};

    const caseDetailsSection =
      (tempDiv.querySelector(".case-details, .main-content, table") as HTMLElement) || tempDiv;
    if (caseDetailsSection) {
      (caseData as any).case_details = {
        success: true,
        data: { data: caseDetailsSection.outerHTML || htmlString },
      };
    }

    const sections = [
      "argument_transcripts",
      "indexing",
      "earlier_court_details",
      "tagged_matters",
      "listing_dates",
      "interlocutory_application",
      "court_fees",
      "notices",
      "defects",
      "judgement_orders",
      "mention_memo",
      "drop_note",
      "office_report",
      "similarities",
    ];

    sections.forEach((section) => {
      const sectionElement = tempDiv.querySelector(
        `.${section}, #${section}, [data-section="${section}"]`
      ) as HTMLElement | null;
      if (sectionElement) {
        (caseData as any)[section] = {
          success: true,
          data: { data: sectionElement.outerHTML },
        };
      }
    });

    if (Object.keys(caseData).length === 1) {
      const tables = tempDiv.querySelectorAll("table");
      if (tables.length > 1) {
        tables.forEach((table, index) => {
          if (index === 0) {
            (caseData as any).case_details = {
              success: true,
              data: { data: (table as HTMLTableElement).outerHTML },
            };
          } else {
            const sectionName = `case_details_table_${index + 1}`;
            (caseData as any)[sectionName] = {
              success: true,
              data: { data: (table as HTMLTableElement).outerHTML },
            };
          }
        });
      }
    }

    const standardTabs = [
      "argument_transcripts",
      "indexing",
      "earlier_court_details",
      "tagged_matters",
      "listing_dates",
      "interlocutory_application",
    ];

    standardTabs.forEach((tab) => {
      if (!(caseData as any)[tab]) {
        (caseData as any)[tab] = {
          success: true,
          data: {
            data: `<div class="placeholder-content">
              <h3>${tab.replace(/_/g, " ").toUpperCase()}</h3>
              <p>This section would contain ${tab.replace(/_/g, " ")} information for the case.</p>
              <table>
                <tr><th>Field</th><th>Value</th></tr>
                <tr><td>Sample Field</td><td>Sample Value</td></tr>
              </table>
            </div>`,
          },
        };
      }
    });

    if ((caseData as any).case_details) {
      const mainContent = (caseData as any).case_details.data.data as string;
      const mainDiv = document.createElement("div");
      mainDiv.innerHTML = mainContent;

      const tables = mainDiv.querySelectorAll("table");
      if (tables.length > 0) {
        let combinedHTML = "";
        tables.forEach((table, index) => {
          combinedHTML += `<div class="table-section">
            <h3>CASE DETAILS - Table ${index + 1}</h3>
            ${(table as HTMLTableElement).outerHTML}
          </div>`;
        });
        (caseData as any).case_details.data.data = combinedHTML;
      } else {
        const textContent = mainDiv.textContent || "";
        if (textContent) {
          const lines = textContent.split("\n").filter((line) => line.trim().length > 0);
          let structuredHTML = '<div class="case-details-content">';
          lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            if (index === 0) {
              structuredHTML += `<h3>CASE DETAILS - Table 1</h3>`;
              structuredHTML += `<table><tbody>`;
            }
            if (trimmedLine.includes("\t")) {
              const parts = trimmedLine.split("\t");
              if (parts.length >= 2) {
                structuredHTML += `<tr><td>${parts[0].trim()}</td><td>${parts[1].trim()}</td></tr>`;
              }
            } else if (trimmedLine.includes(":")) {
              const parts = trimmedLine.split(":");
              if (parts.length >= 2) {
                structuredHTML += `<tr><td>${parts[0].trim()}</td><td>${parts[1].trim()}</td></tr>`;
              }
            }
          });
          structuredHTML += "</tbody></table></div>";
          (caseData as any).case_details.data.data = structuredHTML;
        }
      }
    }

    return caseData;
  } catch (error) {
    console.error("Error creating case data structure:", error);
    return {
      case_details: {
        success: true,
        data: { data: htmlString },
      },
    } as SupremeCourtCaseData;
  }
};

export type { SupremeCourtCaseData as SupremeCaseData };


