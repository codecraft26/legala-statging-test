// Ported subset from React utils: districtId.js
// Note: For brevity, include key entries. Extend as needed.
export type District = { state: string; districts: string[] };

export const districtIndex: District[] = [
  {
    state: "Andhra Pradesh",
    districts: ["Anantapur", "Chittoor", "East Godavari", "Guntur"],
  },
  { state: "Arunachal Pradesh", districts: ["Itanagar", "Tawang"] },
  { state: "Assam", districts: ["Guwahati", "Dibrugarh", "Silchar"] },
  { state: "Bihar", districts: ["Patna", "Gaya", "Bhagalpur"] },
  { state: "Chhattisgarh", districts: ["Raipur", "Bilaspur", "Durg"] },
  { state: "Delhi", districts: ["New Delhi", "South Delhi", "Dwarka"] },
  { state: "Goa", districts: ["North Goa", "South Goa"] },
  { state: "Gujarat", districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] },
  { state: "Haryana", districts: ["Gurugram", "Faridabad", "Panchkula"] },
  { state: "Himachal Pradesh", districts: ["Shimla", "Kangra", "Mandi"] },
  { state: "Jammu & Kashmir", districts: ["Srinagar", "Jammu"] },
  { state: "Jharkhand", districts: ["Ranchi", "Jamshedpur", "Dhanbad"] },
  { state: "Karnataka", districts: ["Bengaluru", "Mysuru", "Mangaluru"] },
  { state: "Kerala", districts: ["Thiruvananthapuram", "Kochi", "Kozhikode"] },
  { state: "Madhya Pradesh", districts: ["Bhopal", "Indore", "Gwalior"] },
  { state: "Maharashtra", districts: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
  { state: "Odisha", districts: ["Bhubaneswar", "Cuttack", "Rourkela"] },
  { state: "Punjab", districts: ["Amritsar", "Ludhiana", "Mohali"] },
  { state: "Rajasthan", districts: ["Jaipur", "Jodhpur", "Udaipur"] },
  { state: "Tamil Nadu", districts: ["Chennai", "Madurai", "Coimbatore"] },
  { state: "Telangana", districts: ["Hyderabad", "Warangal", "Nizamabad"] },
  {
    state: "Uttar Pradesh",
    districts: ["Lucknow", "Varanasi", "Kanpur", "Prayagraj"],
  },
  { state: "Uttarakhand", districts: ["Dehradun", "Haridwar", "Nainital"] },
  { state: "West Bengal", districts: ["Kolkata", "Howrah", "Siliguri"] },
];
