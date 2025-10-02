export type ExtractionUser = {
  name: string;
  email: string;
  role?: string;
};

export type ExtractionResult = {
  id: string;
  file: string;
  data?: Record<string, unknown> | null;
};

export type Extraction = {
  id: string;
  name: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
  createdAt: string | number | Date;
  updatedAt?: string | number | Date;
  tags?: string[];
  instruction?: string | null;
  usage?: unknown;
  user?: ExtractionUser | null;
  extraction_result?: ExtractionResult[] | null;
};
