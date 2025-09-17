"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  date: string;
  title: string;
  notification_link?: string;
  pdf_link?: string;
};

type NotificationBuckets = Record<
  "RBI" | "FEMA" | "NPCI" | "SEBI",
  Notification[]
>;

// Deterministic dummy data ported from the React app (full list)
const DUMMY_NOTIFICATIONS: NotificationBuckets = {
  RBI: [
    {
      date: "Apr 11, 2025",
      title:
        "Reorganisation of Districts in the State of Rajasthan – Review of Lead Bank Responsibility",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12834&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT25CA38902E30F7465FBF5005ADFD061761.PDF",
    },
    {
      date: "Apr 09, 2025",
      title: "Standing Liquidity Facility for Primary Dealers",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12833&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NOTI241AA34550D87D411CA83127A044AC1C95.PDF",
    },
    {
      date: "Apr 09, 2025",
      title:
        "Penal Interest on shortfall in CRR and SLR requirements-Change in Bank Rate",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12832&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NOTI233D38AE66CB4A4093BDE53A7B5178B25B.PDF",
    },
    {
      date: "Apr 09, 2025",
      title: "Liquidity Adjustment Facility - Change in rates",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12831&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT22F0043801856F4224B0165DC873C2C97A.PDF",
    },
    {
      date: "Apr 08, 2025",
      title: "Review of Regulatory Guidelines – Withdrawal of Circulars",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12830&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT2120C90DAE3DDC487983DA4257553CA15F.PDF",
    },
    {
      date: "Apr 03, 2025",
      title:
        "Limits for investment in debt and sale of Credit Default Swaps by Foreign Portfolio Investors (FPIs)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12829&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/20NTCC18A031BDA4428C8E992BC103E8FCB8.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Exposure Norms and Statutory / Other Restrictions - UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12828&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT19E5A780CFF65B4D4583BB768C2E0897D8.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular - Management of Advances - UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12827&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/18MC01042025616166709B48430A987603C6FB23589F.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular - Housing Finance for UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12826&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT17DC5A1D8BA84E420CA6AAA87B4E05F17F.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Direction - Reserve Bank of India (Interest Rate on Deposits) Directions, 2025",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12825&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MD134346AD90D94CE4C2683A4CC4D6A6B5576.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular – Housing Finance",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12824&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT168E73C887EB7C4C69A01A0F2FB458C9AB.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Bank Finance to Non-Banking Financial Companies (NBFCs)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12823&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT150D4BEA3889CD42F794F124D97AEB5B69.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Income Recognition, Asset Classification, Provisioning and Other Related Matters - UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12821&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/14MC01042025B5575C2EF9D247CAA5FBB2585B1CBB4B.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Prudential norms on Income Recognition, Asset Classification and Provisioning pertaining to Advances",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12822&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/13MC01042025792E33CF094B46F2B838E6409777438D.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular - Guarantees and Co-acceptances",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12820&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/12MC01042025798B538ADFE74E5FA4D88A5874AD7248.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Guarantees, Co-acceptances & Letters of Credit - UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12819&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MC01042025B50554F5151F4E2593699A034105BAA2.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Direction – Facility for Exchange of Notes and Coins",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12818&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MD1332AB67885F67843569D47E893E23EF959.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Reserve Bank of India (Classification, Valuation and Operation of the Investment Portfolio of Commercial Banks) Directions, 2023",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12817&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/10NTEEF0C3A849364D19BA1D99AD251E57DA.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Prudential Norms on Capital Adequacy - Primary (Urban) Co-operative Banks (UCBs)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12816&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/09MC01042025579866A57486476EBBEAB63366EB95B7.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Direction on Counterfeit Notes, 2025 – Detection, Reporting and Monitoring",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12814&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MDCND0104202580F6E20BEB804BF6A10E8551EFDCA39F.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular – Basel III Capital Regulations",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12815&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NT08F65FDFBB966942CAA08E0D766F2F6BD4.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular on Board of Directors - UCBs",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12813&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/07MC0104202508D52A1219FA468D864D393D72C3CC4B.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular on Conduct of Government Business by Agency Banks - Payment of Agency Commission",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12812&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/06MC010425F12568B380B14D9CBFEC5270EA9F5FF3.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Disbursement of Government Pension by Agency Banks",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12811&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/05MC010420252ED8A74EE428468287D815016A33587F.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Direction – Scheme of Penalties for bank branches and currency chests for deficiency in rendering customer service to the members of public",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12810&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MD13101042025671F8F57253649588A32B08B06B0CA82.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Direction on Penal Provisions in reporting of transactions / balances at Currency Chests",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12809&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MD130010420256D973D29CB9749AE93AA109978A2B9CB.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular – Lead Bank Scheme",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12808&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/04MC01042025636879CB4F0548F490DC312D96B7D2C1.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular - Credit facilities to Scheduled Castes (SCs) & Scheduled Tribes (STs)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12807&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/03MCCC01042025AE0443642B944F72936B15767028ED2B.PDF",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Master Circular – Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12806&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/02MC010420256177154636DF4920B0F75500DDCDB82D.PDF",
    },
    {
      date: "Apr 01, 2025",
      title: "Master Circular on SHG-Bank Linkage Programme",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12805&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/01MCD0D97308D3AD49A3908E2F4410ED4409.PDF",
    },
    {
      date: "Mar 29, 2025",
      title: "Revised norms for Government Guaranteed Security Receipts (SRs)",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12804&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NOT13566D9130460024ABABA38EBCD37EDCBC0.PDF",
    },
    {
      date: "Mar 28, 2025",
      title: "Special Clearing Operations on March 31, 2025",
      notification_link:
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12803&Mode=0",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NOTI1347F70140D5FF94A8C82A4DEEB0877491E.PDF",
    },
  ],
  FEMA: [
    {
      date: "Feb 12, 2025",
      title:
        "Foreign Exchange Management (Manner of Receipt and Payment) (Amendment) Regulations, 2025",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12779",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA14R(1)12022025937F223E951C4B17A572909928D39D35.PDF",
    },
    {
      date: "Jan 16, 2025",
      title:
        "Foreign Exchange Management (Foreign Currency Accounts by a person resident in India) (Fifth Amendment) Regulations, 2025",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12767",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA10R160120253E949765CCCB4B8FB73DF8528900E5A9.PDF",
    },
    {
      date: "Jan 16, 2025",
      title:
        "Foreign Exchange Management (Mode of Payment and Reporting of Non-Debt Instruments) (Third Amendment) Regulations, 2025",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12768",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA39516012025F6708D35EF714F0494C879D64D6E7EE6.PDF",
    },
    {
      date: "Jan 16, 2025",
      title:
        "Foreign Exchange Management (Deposit) (Fifth Amendment) Regulations, 2025",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12766",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA5R160120252E749A30BDE240B68D0CADA6A572F06A.PDF",
    },
    {
      date: "Nov 19, 2024",
      title:
        "Foreign Exchange Management (Foreign Currency Accounts by a Person Resident in India) (Fourth Amendment) Regulations, 2024",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12758",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/NOTI10R42024B0BC1EE237A34670B40D1C0C09D1C42F.PDF",
    },
    {
      date: "May 10, 2024",
      title:
        "Foreign Exchange Management (Deposit) (Fourth Amendment) Regulations, 2024",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12684",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA5(R)10052024B1670F780B31466D9865CFECFD914115.PDF",
    },
    {
      date: "Apr 25, 2024",
      title:
        "Foreign Exchange Management (Mode of Payment and Reporting of Non-Debt Instruments) (Amendment) Regulations, 2024",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12673",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/AMENDMENTFEMA395800362AB7AE242719B9DB8CE256E6329.PDF",
    },
    {
      date: "Apr 25, 2024",
      title:
        "Foreign Exchange Management (Foreign Currency Accounts by a person resident in India) (Amendment) Regulations, 2024",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12674",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FCM10R25042024BFD3086C81B14BE3AEF736407A9485B9.PDF",
    },
    {
      date: "Dec 22, 2023",
      title:
        "Foreign Exchange Management (Manner of Receipt and Payment) Regulations, 2023 (Amended up to February 12, 2025)",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12579",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA14R952AB1118F28466C951910A7D957C382.PDF",
    },
    {
      date: "Oct 16, 2023",
      title:
        "Foreign Exchange Management (Debt Instruments) (Second Amendment) Regulations, 2023",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12706",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA396(2)_1907202401B62C6D0F164B268EB6C796886BC8BE.PDF",
    },
    {
      date: "Aug 22, 2022",
      title:
        "Foreign Exchange Management (Overseas Investment) Regulations, 2022",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12380",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA400E3410E8B6F384DF982443E53E6688627.PDF",
    },
    {
      date: "Jul 28, 2022",
      title:
        "Foreign Exchange Management (Borrowing and Lending) (Amendment) Regulations, 2022",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12377",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA12082022FAF179750C5F402B91C9488A239A6E09.PDF",
    },
    {
      date: "Oct 13, 2021",
      title:
        "Foreign Exchange Management (Debt Instruments) (First Amendment) Regulations, 2021",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12705",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA396(1)_19072024B0F961D870C94D37A069084695AAD88A.PDF",
    },
    {
      date: "Sep 08, 2021",
      title:
        "Foreign Exchange Management (Export of Goods and Services) (Amendment) Regulations, 2021",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12167",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA28092021F4D265E37DF2494793463F8CA5050A99.PDF",
    },
    {
      date: "Jan 08, 2021",
      title:
        "Foreign Exchange Management (Export of Goods and Services) (Amendment) Regulations, 2021",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12014",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA237A482EDEB9C647469877E7AB32D04EE0.PDF",
    },
    {
      date: "Dec 03, 2020",
      title:
        "Foreign Exchange Management (Export and Import of Currency) (Second Amendment) Regulations, 2020",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12012",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/6RFEMA03122020BFDB8E58BEDA4E0CB99472F3223B8FB4.PDF",
    },
    {
      date: "Oct 23, 2020",
      title:
        "Foreign Exchange Management (Margin for Derivative Contracts) Regulations, 2020",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=12097",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/MDCR2020F3B2E26984D645C28859EB4135579FF1.PDF",
    },
    {
      date: "Aug 11, 2020",
      title:
        "Foreign Exchange Management (Export and Import of Currency) (Amendment) Regulations, 2020",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=11965",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA6R15092020304548C2612B4D249DFBC281C257B9C4.PDF",
    },
    {
      date: "Jun 15, 2020",
      title:
        "Foreign Exchange Management (Mode of Payment and Reporting of Non-Debt Instruments) (Amendment) Regulations, 2020",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=11939",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA39511506202EF28C4ADF1B4C15842B39DA72B59008.PDF",
    },
    {
      date: "Mar 31, 2020",
      title:
        "Foreign Exchange Management (Export of Goods and Services) (Amendment) Regulations, 2020",
      notification_link:
        "https://rbi.org.in/BS_FemaNotifications.aspx?Id=11856",
      pdf_link:
        "https://rbidocs.rbi.org.in/rdocs/notification/PDFs/FEMA23R3991A9612AEE34BB0BD8FC52B66CC4060.PDF",
    },
  ],
  NPCI: [
    {
      date: "2025",
      title:
        "UPI | OC No. 76C | FY 2025-26 | Addendum to NPCI/UPI/2025-26/OC76 - Revision in transaction limits based on merchant & transactions type",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-76C-FY-2025-26-Addendum-to-OC76-Revision-in-transaction-limits-based-on-merchant-transactions-type.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-76C-FY-2025-26-Addendum-to-OC76-Revision-in-transaction-limits-based-on-merchant-transactions-type.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 141 D | FY 2024-25 | Compliance Addendum to OC 141 series",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-141-D-FY-2024-25-Compliance-Addendum-to-OC-141-series.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-141-D-FY-2024-25-Compliance-Addendum-to-OC-141-series.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 206 A | FY 2024-25 | Addendum to OC 206 Implementation of Generic Good Faith Debit Adjustments",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-206-A-FY-2024-25-Addendum-to-OC-206-Implementation-of-Generic-Good-Faith-Debit-Adjustments.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-206-A-FY-2024-25-Addendum-to-OC-206-Implementation-of-Generic-Good-Faith-Debit-Adjustments.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 184 A | FY 2024-25 | Addendum to OC 184 Modification in UPI chargeback rules and procedures",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-184-A-FY-2024-25-Addendum-to-OC-184-Modification-in-UPI-chargeback-rules-and-procedures.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-184-A-FY-2024-25-Addendum-to-OC-184-Modification-in-UPI-chargeback-rules-and-procedures.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 115 E | FY 2024-25 | Addendum to circular on the Numeric UPI ID resolution",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-115-E-FY-2024-25-Addendum-to-circular-on-the-Numeric-UPI-ID-resolution.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-115-E-FY-2024-25-Addendum-to-circular-on-the-Numeric-UPI-ID-resolution.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 169 A | FY 2024-25 | Addendum to Enhancement in UPI LITE Limits",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-169-A-FY202425-Addendum-to-Enhancement-in-UPI-LITE-Limits.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-169-A-FY202425-Addendum-to-Enhancement-in-UPI-LITE-Limits.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 138 B | FY 2024-25 | Addendum to Introduction of UPI LITE",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-138-B-FY-2024-25-Addendum-to-Introduction-of-UPI-LITE.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-138-B-FY-2024-25-Addendum-to-Introduction-of-UPI-LITE.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 213 | FY 2024-25 | Auto Acceptance & Rejection of Chargeback",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-213-FY-2024-25-Auto-Acceptance-Rejection-of-Chargeback.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-213-FY-2024-25-Auto-Acceptance-Rejection-of-Chargeback.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 212 | FY 2024-25 | Guidelines on Merchant Acquiring in UPI by Co-operative Banks",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/NPCI-UPI-OC-212-2024-25-Guidelines-on-Merchant-Acquiring-in-UPI-by-Co-operative-Banks.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/NPCI-UPI-OC-212-2024-25-Guidelines-on-Merchant-Acquiring-in-UPI-by-Co-operative-Banks.pdf",
    },
    {
      date: "2025",
      title:
        "UPI | OC No. 193 C | FY 24-25 – Addendum to OC 193 - compliance to UPI technical specifications – TRAN ID",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-193-C-FY-24-25-Addendum-to-OC-193-compliance-to-UPI-technical-specifications-TRAN-ID.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-193-C-FY-24-25-Addendum-to-OC-193-compliance-to-UPI-technical-specifications-TRAN-ID.pdf",
    },
    {
      date: "2025",
      title: "UPI | OC No. 211 | FY 24-25 – Reset Password Process for URCS",
      notification_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/OC-211-Reset-Password-Process-for-URCS.pdf",
      pdf_link:
        "https://www.npci.org.in/PDF/npci/upi/circular/2025/OC-211-Reset-Password-Process-for-URCS.pdf",
    },
  ],
  SEBI: [
    {
      date: "Apr 11, 2025",
      title:
        "Specialized Investment Funds (‘SIF’) – Application and Investment Strategy Information Document (ISID) formats",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/specialized-investment-funds-sif-application-and-investment-strategy-information-document-isid-formats_93442.html",
      pdf_link: "None",
    },
    {
      date: "Apr 09, 2025",
      title:
        "Clarification on Regulatory framework for Specialized Investment Funds (‘SIF’)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/clarification-on-regulatory-framework-for-specialized-investment-funds-sif-_93401.html",
      pdf_link: "None",
    },
    {
      date: "Apr 09, 2025",
      title:
        "Amendment to Circular for mandating additional disclosures by FPIs that fulfil certain objective criteria",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/amendment-to-circular-for-mandating-additional-disclosures-by-fpis-that-fulfil-certain-objective-criteria_93399.html",
      pdf_link: "None",
    },
    {
      date: "Apr 04, 2025",
      title:
        "Standardized format for System and Network audit report of Market Infrastructure Institutions(MIIs)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/standardized-format-for-system-and-network-audit-report-of-market-infrastructure-institutions-miis-_93324.html",
      pdf_link: "None",
    },
    {
      date: "Apr 04, 2025",
      title:
        "Recognition and operationalization of Past Risk and Return Verification Agency (PaRRVA)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/recognition-and-operationalization-of-past-risk-and-return-verification-agency-parrva-_93321.html",
      pdf_link: "None",
    },
    {
      date: "Apr 02, 2025",
      title:
        "Relaxation of provision of advance fee restrictions in case of Investment Advisers and Research Analysts",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/relaxation-of-provision-of-advance-fee-restrictions-in-case-of-investment-advisers-and-research-analysts_93251.html",
      pdf_link: "None",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Clarification on the position of Compliance Officer in terms of regulation 6 of the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/clarification-on-the-position-of-compliance-officer-in-terms-of-regulation-6-of-the-sebi-listing-obligations-and-disclosure-requirements-regulations-2015_93186.html",
      pdf_link: "None",
    },
    {
      date: "Apr 01, 2025",
      title:
        "Extension of timeline for formulation of implementation standards pertaining to SEBI Circular on “Safer participation of retail investors in Algorithmic trading”",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/apr-2025/extension-of-timeline-for-formulation-of-implementation-standards-pertaining-to-sebi-circular-on-safer-participation-of-retail-investors-in-algorithmic-trading-_93166.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title:
        "Extension towards Adoption and Implementation of Cybersecurity and Cyber Resilience Framework (CSCRF) for SEBI Regulated Entities (REs)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/extension-towards-adoption-and-implementation-of-cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_93146.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title:
        "Amendment to Master Circular for Infrastructure Investment Trusts (InvITs) dated May 15, 2024",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/amendment-to-master-circular-for-infrastructure-investment-trusts-invits-dated-may-15-2024_93145.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title:
        "Amendment to Master Circular for Real Estate Investment Trusts (REITs) dated May 15, 2024",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/amendment-to-master-circular-for-real-estate-investment-trusts-reits-dated-may-15-2024_93143.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title: "Intraday Monitoring of Position Limits for Index Derivatives",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/intraday-monitoring-of-position-limits-for-index-derivatives_93123.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title:
        "Measures to facilitate ease of doing business with respect to framework for assurance or assessment, ESG disclosures for value chain, and introduction of voluntary disclosure on green credits",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/measures-to-facilitate-ease-of-doing-business-with-respect-to-framework-for-assurance-or-assessment-esg-disclosures-for-value-chain-and-introduction-of-voluntary-disclosure-on-green-credits_93102.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title: "Extension of timelines for submission of offsite inspection data",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/extension-of-timelines-for-submission-of-offsite-inspection-data_93101.html",
      pdf_link: "None",
    },
    {
      date: "Mar 28, 2025",
      title: "Extension of timelines for submission of offsite inspection data",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/extension-of-timelines-for-submission-of-offsite-inspection-data_93100.html",
      pdf_link: "None",
    },
    {
      date: "Mar 21, 2025",
      title:
        "Industry Standards on “Minimum information to be provided for review of the audit committee and shareholders for approval of a related party transaction”",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/industry-standards-on-minimum-information-to-be-provided-for-review-of-the-audit-committee-and-shareholders-for-approval-of-a-related-party-transaction-_92843.html",
      pdf_link: "None",
    },
    {
      date: "Mar 21, 2025",
      title:
        'Facilitating ease of doing business relating to the framework on "Alignment of interest of the Designated Employees of the Asset Management Company (AMC) with the interest of the unitholders"',
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/facilitating-ease-of-doing-business-relating-to-the-framework-on-alignment-of-interest-of-the-designated-employees-of-the-asset-management-company-amc-with-the-interest-of-the-unitholders-_92842.html",
      pdf_link: "None",
    },
    {
      date: "Mar 20, 2025",
      title:
        "Disclosure of holding of specified securities in dematerialized form",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/disclosure-of-holding-of-specified-securities-in-dematerialized-form_92797.html",
      pdf_link: "None",
    },
    {
      date: "Mar 20, 2025",
      title:
        "Online Filing System for reports filed under Regulation 10(7) of SEBI (Substantial Acquisition of Shares and Takeovers) Regulations, 2011",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/online-filing-system-for-reports-filed-under-regulation-10-7-of-sebi-substantial-acquisition-of-shares-and-takeovers-regulations-2011_92791.html",
      pdf_link: "None",
    },
    {
      date: "Mar 19, 2025",
      title:
        "Harnessing DigiLocker as a Digital Public Infrastructure for reducing Unclaimed Assets in the Indian Securities Market",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/harnessing-digilocker-as-a-digital-public-infrastructure-for-reducing-unclaimed-assets-in-the-indian-securities-market_92769.html",
      pdf_link: "None",
    },
    {
      date: "Mar 19, 2025",
      title: "Framework on Social Stock Exchange (SSE)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/framework-on-social-stock-exchange-sse-_92767.html",
      pdf_link: "None",
    },
    {
      date: "Mar 11, 2025",
      title:
        "Faster Rights Issue with a flexibility of allotment to specific investor(s)",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/faster-rights-issue-with-a-flexibility-of-allotment-to-specific-investor-s-_92622.html",
      pdf_link: "None",
    },
    {
      date: "Mar 03, 2025",
      title:
        "Relaxation in timeline for reporting of differential rights issued by AIFs",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/mar-2025/relaxation-in-timeline-for-reporting-of-differential-rights-issued-by-aifs_92411.html",
      pdf_link: "None",
    },
    {
      date: "Feb 28, 2025",
      title:
        "Industry Standards on Key Performance Indicators (“KPIs”) Disclosures in the draft Offer Document and Offer Document",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/feb-2025/industry-standards-on-key-performance-indicators-kpis-disclosures-in-the-draft-offer-document-and-offer-document_92380.html",
      pdf_link: "None",
    },
    {
      date: "Feb 28, 2025",
      title:
        "Amendments and clarifications to Circular dated January 10, 2025 on Revise and Revamp Nomination Facilities in the Indian Securities Market",
      notification_link:
        "https://www.sebi.gov.in/legal/circulars/feb-2025/amendments-and-clarifications-to-circular-dated-january-10-2025-on-revise-and-revamp-nomination-facilities-in-the-indian-securities-market_92377.html",
      pdf_link: "None",
    },
  ],
};

type SectionId = keyof NotificationBuckets;

const MENU_OPTIONS: { id: SectionId; name: string }[] = [
  { id: "RBI", name: "RBI" },
  { id: "FEMA", name: "FEMA" },
  { id: "NPCI", name: "NPCI" },
  { id: "SEBI", name: "SEBI" },
];

const DATE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

function parseNotificationDate(value: string): Date | null {
  if (value === "2025") {
    return new Date("2025-07-01");
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function useFilteredNotifications(
  section: SectionId,
  dateFilter: (typeof DATE_OPTIONS)[number]["value"],
  searchQuery: string
) {
  const base = DUMMY_NOTIFICATIONS[section] ?? [];

  const dateFiltered = useMemo(() => {
    if (dateFilter === "all") return base;
    const days = parseInt(dateFilter, 10);
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() - days);
    return base.filter((n) => {
      const nd = parseNotificationDate(n.date);
      return nd && nd >= cutoff;
    });
  }, [base, dateFilter]);

  const searchFiltered = useMemo(() => {
    if (!searchQuery) return dateFiltered;
    const q = searchQuery.toLowerCase();
    return dateFiltered.filter((n) => n.title.toLowerCase().includes(q));
  }, [dateFiltered, searchQuery]);

  return searchFiltered;
}

function ShimmerLoading() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((k) => (
        <div
          key={k}
          className="p-4 bg-gray-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-4"
        >
          <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mb-4" />
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  category,
}: {
  notification: Notification;
  category: SectionId;
}) {
  const { title, date, notification_link, pdf_link } = notification;
  const badgeColor: Record<SectionId, string> = {
    RBI: "bg-blue-900",
    FEMA: "bg-blue-800",
    NPCI: "bg-blue-700",
    SEBI: "bg-blue-600",
  };
  return (
    <div className="p-4 bg-gray-50 dark:bg-zinc-900/40 rounded-lg border-l-4 border-blue-600 mb-4">
      <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <div className="flex flex-wrap gap-3 mb-3">
        {notification_link && (
          <a
            href={notification_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            View Notification
          </a>
        )}
        {pdf_link && pdf_link !== "None" && (
          <a
            href={pdf_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            View PDF
          </a>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-zinc-400 text-sm">{date}</span>
        <span
          className={`${badgeColor[category]} text-white text-xs px-2 py-1 rounded`}
        >
          {category}
        </span>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionId>("RBI");
  const [dateFilter, setDateFilter] =
    useState<(typeof DATE_OPTIONS)[number]["value"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedDateLabel = useMemo(
    () =>
      DATE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "Last 15 days",
    [dateFilter]
  );

  const notifications = useFilteredNotifications(
    activeSection,
    dateFilter,
    searchQuery
  );

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, [activeSection, dateFilter]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-zinc-950">
      <aside className="w-40 h-full bg-amber-50 dark:bg-zinc-900 shadow-md">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <img src="/logo.png" className="w-32" alt="Logo" />
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center w-full py-3 px-6 border-b border-zinc-200 dark:border-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-900/20"
        >
          <span className="mr-2">🏠</span>
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-200">
            Home
          </span>
        </button>
        <div className="py-4">
          {MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`w-full text-left py-3 px-6 text-lg font-medium transition-colors ${
                activeSection === option.id
                  ? "bg-amber-100 dark:bg-amber-900/20 border-l-4 border-blue-900"
                  : "hover:bg-amber-100 dark:hover:bg-amber-900/20"
              }`}
              onClick={() => setActiveSection(option.id)}
            >
              <span className="text-zinc-900 dark:text-zinc-200">
                {option.name}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <button
              className="flex items-center justify-between min-w-40 px-4 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded shadow-sm border border-zinc-200 dark:border-zinc-800"
              onClick={() => setIsDropdownOpen((v) => !v)}
            >
              <span>{selectedDateLabel}</span>
              <span className="ml-2 text-xs">▼</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute mt-1 w-40 bg-white dark:bg-zinc-900 dark:text-zinc-200 rounded shadow-md z-10 border border-zinc-200 dark:border-zinc-800">
                {DATE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 ${dateFilter === option.value ? "bg-gray-100 dark:bg-zinc-800 font-medium" : ""}`}
                    onClick={() => {
                      setDateFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 ml-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-zinc-400">🔍</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
            {MENU_OPTIONS.find((o) => o.id === activeSection)?.name}{" "}
            Notifications
          </h2>
          {isLoading ? (
            <>
              <div className="flex justify-center items-center mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mr-3" />
                <span className="text-lg font-medium text-blue-700 dark:text-blue-400">
                  Fetching Notifications...
                </span>
              </div>
              <ShimmerLoading />
            </>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500 dark:text-zinc-400">
              No notifications available.
            </p>
          ) : (
            <div>
              {notifications.map((n, idx) => (
                <NotificationItem
                  key={idx}
                  notification={n}
                  category={activeSection}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
