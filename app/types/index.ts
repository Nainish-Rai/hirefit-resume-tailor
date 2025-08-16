export type ProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

export interface ProcessingStatus {
  state: ProcessingState;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

export interface WorkbenchLine {
  index: number;
  originalText: string;
  suggestedText: string;
  choice: "original" | "suggested" | "custom";
  customText?: string;
}

export interface ApiResponse {
  fileName: string;
  totalLines: number;
  lines: {
    index: number;
    originalText: string;
    suggestedText: string;
  }[];
}
