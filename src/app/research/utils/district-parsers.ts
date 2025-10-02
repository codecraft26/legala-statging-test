"use client";

export interface ParsedCaseDetails {
  courtName: string;
  caseInfo: {
    caseType: string;
    filingNumber: string;
    filingDate: string;
    registrationNumber: string;
    registrationDate: string;
    cnrNumber: string;
  };
  caseStatus: {
    firstHearingDate: string;
    nextHearingDate: string;
    caseStatus: string;
    stageOfCase: string;
    courtNumberAndJudge: string;
  };
  parties: {
    petitioners: Array<{
      name: string;
      advocate?: string;
    }>;
    respondents: Array<{
      name: string;
      advocate?: string;
    }>;
  };
  acts: Array<{
    act: string;
    sections: string;
  }>;
  caseHistory: Array<{
    registrationNumber: string;
    judge: string;
    businessOnDate: string;
    hearingDate: string;
    purposeOfHearing: string;
  }>;
  processDetails: Array<{
    processId: string;
    processDate: string;
    processTitle: string;
    partyName: string;
    issuedProcess: string;
  }>;
}

export function parseCaseDetailsHTML(
  htmlString: string
): ParsedCaseDetails | null {
  try {
    if (!htmlString || typeof htmlString !== "string") {
      return null;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    const courtNameElement = tempDiv.querySelector("h2");
    const courtName = courtNameElement?.textContent?.trim() || "Civil Court";

    const caseDetailsCaption = Array.from(
      tempDiv.querySelectorAll("caption")
    ).find((caption) => caption.textContent?.includes("Case Details"));
    const caseDetailsTable =
      caseDetailsCaption?.parentElement?.querySelector("tbody tr");
    const caseInfo = {
      caseType: caseDetailsTable?.children[0]?.textContent?.trim() || "",
      filingNumber: caseDetailsTable?.children[1]?.textContent?.trim() || "",
      filingDate: caseDetailsTable?.children[2]?.textContent?.trim() || "",
      registrationNumber:
        caseDetailsTable?.children[3]?.textContent?.trim() || "",
      registrationDate:
        caseDetailsTable?.children[4]?.textContent?.trim() || "",
      cnrNumber: caseDetailsTable?.children[5]?.textContent?.trim() || "",
    };

    const statusCaption = Array.from(tempDiv.querySelectorAll("caption")).find(
      (caption) => caption.textContent?.includes("Case Status")
    );
    const statusTable = statusCaption?.parentElement?.querySelector("tbody tr");
    const caseStatus = {
      firstHearingDate: statusTable?.children[0]?.textContent?.trim() || "",
      nextHearingDate: statusTable?.children[1]?.textContent?.trim() || "",
      caseStatus: statusTable?.children[2]?.textContent?.trim() || "",
      stageOfCase: statusTable?.children[3]?.textContent?.trim() || "",
      courtNumberAndJudge: statusTable?.children[4]?.textContent?.trim() || "",
    };

    const petitioners: Array<{ name: string; advocate?: string }> = [];
    const respondents: Array<{ name: string; advocate?: string }> = [];

    const petitionerHeading = Array.from(tempDiv.querySelectorAll("h5")).find(
      (h5) => h5.textContent?.includes("Petitioner")
    );
    if (petitionerHeading) {
      const petitionerSection = petitionerHeading.nextElementSibling;
      if (petitionerSection) {
        const petitionerItems = petitionerSection.querySelectorAll("li");
        petitionerItems.forEach((item) => {
          const nameElement = item.querySelector("p");
          const advocateText = item.textContent || "";
          const name = nameElement?.textContent?.trim() || "";
          const advocateMatch = advocateText.match(/Advocate - (.+)/);
          const advocate = advocateMatch ? advocateMatch[1].trim() : undefined;
          if (name) {
            petitioners.push({ name, advocate });
          }
        });
      }
    }

    const respondentHeading = Array.from(tempDiv.querySelectorAll("h5")).find(
      (h5) => h5.textContent?.includes("Respondent")
    );
    if (respondentHeading) {
      const respondentSection = respondentHeading.nextElementSibling;
      if (respondentSection) {
        const respondentItems = respondentSection.querySelectorAll("li");
        respondentItems.forEach((item) => {
          const nameElement = item.querySelector("p");
          const name = nameElement?.textContent?.trim() || "";
          if (name) {
            respondents.push({ name });
          }
        });
      }
    }

    const acts: Array<{ act: string; sections: string }> = [];
    const actsCaption = Array.from(tempDiv.querySelectorAll("caption")).find(
      (caption) => caption.textContent?.includes("Acts")
    );
    if (actsCaption) {
      const actsTable = actsCaption.parentElement?.querySelector("tbody");
      if (actsTable) {
        const actRows = actsTable.querySelectorAll("tr");
        actRows.forEach((row) => {
          const act = (row.children[0]?.textContent || "").trim();
          const sections = (row.children[1]?.textContent || "").trim();
          if (act) acts.push({ act, sections });
        });
      }
    }

    const caseHistory: Array<{
      registrationNumber: string;
      judge: string;
      businessOnDate: string;
      hearingDate: string;
      purposeOfHearing: string;
    }> = [];
    const historyCaption = Array.from(tempDiv.querySelectorAll("caption")).find(
      (caption) => caption.textContent?.includes("Case History")
    );
    if (historyCaption) {
      const historyTable = historyCaption.parentElement?.querySelector("tbody");
      if (historyTable) {
        const historyRows = historyTable.querySelectorAll("tr");
        historyRows.forEach((row) => {
          const registrationNumber = (
            row.children[0]?.textContent || ""
          ).trim();
          const judge = (row.children[1]?.textContent || "").trim();
          const businessOnDate = (row.children[2]?.textContent || "").trim();
          const hearingDate = (row.children[3]?.textContent || "").trim();
          const purposeOfHearing = (row.children[4]?.textContent || "").trim();
          if (registrationNumber) {
            caseHistory.push({
              registrationNumber,
              judge,
              businessOnDate,
              hearingDate,
              purposeOfHearing,
            });
          }
        });
      }
    }

    const processDetails: Array<{
      processId: string;
      processDate: string;
      processTitle: string;
      partyName: string;
      issuedProcess: string;
    }> = [];
    const processCaption = Array.from(tempDiv.querySelectorAll("caption")).find(
      (caption) => caption.textContent?.includes("Process Details")
    );
    if (processCaption) {
      const processTable = processCaption.parentElement?.querySelector("tbody");
      if (processTable) {
        const processRows = processTable.querySelectorAll("tr");
        processRows.forEach((row) => {
          const processId = (row.children[0]?.textContent || "").trim();
          const processDate = (row.children[1]?.textContent || "").trim();
          const processTitle = (row.children[2]?.textContent || "").trim();
          const partyName = (row.children[3]?.textContent || "").trim();
          const issuedProcess = (row.children[4]?.textContent || "").trim();
          if (processId)
            processDetails.push({
              processId,
              processDate,
              processTitle,
              partyName,
              issuedProcess,
            });
        });
      }
    }

    return {
      courtName,
      caseInfo,
      caseStatus,
      parties: { petitioners, respondents },
      acts,
      caseHistory,
      processDetails,
    };
  } catch {
    return null;
  }
}

export function parseDistrictCourtHTML(
  htmlString: string,
  districtName: string,
  litigantName: string,
  caseStatus: string
): { [courtName: string]: any[] } {
  const courtResults: { [courtName: string]: any[] } = {};
  try {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    const tableContents = tempDiv.querySelectorAll(".distTableContent");
    tableContents.forEach((tableContent) => {
      const estCode = tableContent.getAttribute("id") || "";
      const caption = tableContent.querySelector("caption")?.textContent || "";
      const tbody = tableContent.querySelector("tbody");

      if (tbody && caption) {
        const rows = tbody.querySelectorAll("tr");
        const courtCases: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 4) {
            const serialNumber = (cells[0]?.textContent || "").trim();
            const caseInfo = (cells[1]?.textContent || "").trim();
            const partyInfo = (cells[2]?.textContent || "").trim();
            const viewLink = cells[3]?.querySelector("a");
            const cino = viewLink?.getAttribute("data-cno") || "";

            const caseInfoParts = caseInfo.split("/");
            const caseType = (caseInfoParts[0] || "").trim();
            const caseNumber = (caseInfoParts[1] || "").trim();
            const caseYear = (caseInfoParts[2] || "").trim();

            const partyParts = partyInfo.split("<br/>");
            let petitioner = "";
            let respondent = "";
            if (partyParts.length >= 2) {
              petitioner = (partyParts[0] || "").replace(/<[^>]*>/g, "").trim();
              const respondentPart = (partyParts[1] || "")
                .replace(/<[^>]*>/g, "")
                .trim();
              if (respondentPart.toLowerCase().includes("versus")) {
                respondent = respondentPart.split("versus")[1]?.trim() || "";
              } else {
                respondent = respondentPart;
              }
            } else {
              petitioner = partyInfo.replace(/<[^>]*>/g, "").trim();
            }

            if (cino) {
              courtCases.push({
                cino,
                district_name: districtName,
                litigant_name: litigantName,
                case_status: caseStatus,
                petitioner_name: petitioner,
                respondent_name: respondent,
                case_type: caseType,
                case_number: caseNumber,
                case_year: caseYear,
                serial_number: serialNumber,
                court_name: caption,
                est_code: estCode,
              });
            }
          }
        });

        if (courtCases.length > 0) {
          courtResults[caption] = courtCases;
        }
      }
    });
  } catch {
    // ignore
  }
  return courtResults;
}
