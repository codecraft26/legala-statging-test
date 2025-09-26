// State code to state name mapping
export const stateCodeMapping = [
  { code: "1", name: "Andhra Pradesh" },
  { code: "2", name: "Assam" },
  { code: "3", name: "Bihar" },
  { code: "4", name: "Gujarat" },
  { code: "5", name: "Himachal Pradesh" },
  { code: "6", name: "Jammu and Kashmir" },
  { code: "7", name: "Karnataka" },
  { code: "8", name: "Kerala" },
  { code: "9", name: "Madhya Pradesh" },
  { code: "10", name: "Maharashtra" },
  { code: "11", name: "Manipur" },
  { code: "12", name: "Meghalaya" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Orissa" },
  { code: "15", name: "Punjab" },
  { code: "16", name: "Rajasthan" },
  { code: "17", name: "Tamil Nadu" },
  { code: "18", name: "Tripura" },
  { code: "19", name: "Uttar Pradesh" },
  { code: "20", name: "West Bengal" },
  { code: "21", name: "Sikkim" },
  { code: "22", name: "Arunachal Pradesh" },
  { code: "23", name: "Mizoram" },
  { code: "24", name: "Goa" },
  { code: "25", name: "Pondicherry" },
  { code: "26", name: "Delhi" },
  { code: "27", name: "Chandigarh" },
  { code: "28", name: "Haryana" },
  { code: "29", name: "Andaman and Nicobar Islands" },
  { code: "30", name: "Lakshadweep" },
  { code: "31", name: "Dadra and Nagar Haveli" },
  { code: "32", name: "Daman and Diu" },
  { code: "33", name: "Chhattisgarh" },
  { code: "34", name: "Jharkhand" },
  { code: "35", name: "Uttarakhand" },
  { code: "36", name: "Telangana" },
];

// Court Complex Code to Court Complex Name mapping (sample data - should be fetched from API)
export const courtComplexMapping = [
  { code: "1", name: "Principal Bench" },
  { code: "2", name: "Circuit Bench" },
  { code: "3", name: "Additional Bench" },
  { code: "4", name: "Regional Bench" },
  { code: "5", name: "Special Bench" },
];

// Court Code to Court Name mapping (sample data - should be fetched from API)
export const courtCodeMapping = [
  { code: "1", name: "High Court" },
  { code: "2", name: "District Court" },
  { code: "3", name: "Sessions Court" },
  { code: "4", name: "Magistrate Court" },
  { code: "5", name: "Special Court" },
];

// Helper functions
export const getStateName = (code: string): string => {
  const state = stateCodeMapping.find((s) => s.code === code);
  return state ? state.name : code;
};

export const getStateCode = (name: string): string => {
  const state = stateCodeMapping.find((s) => s.name === name);
  return state ? state.code : name;
};

export const getCourtComplexName = (code: string): string => {
  const complex = courtComplexMapping.find((c) => c.code === code);
  return complex ? complex.name : code;
};

export const getCourtComplexCode = (name: string): string => {
  const complex = courtComplexMapping.find((c) => c.name === name);
  return complex ? complex.code : name;
};

export const getCourtName = (code: string): string => {
  const court = courtCodeMapping.find((c) => c.code === code);
  return court ? court.name : code;
};

export const getCourtCode = (name: string): string => {
  const court = courtCodeMapping.find((c) => c.name === name);
  return court ? court.code : name;
};
