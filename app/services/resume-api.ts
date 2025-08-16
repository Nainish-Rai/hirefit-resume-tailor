import type { ApiResponse } from "../types";
import { createBlobUrl, generateTailoredFileName } from "../utils/file-utils";

export async function previewResume(
  file: File,
  jobDescription: string
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);
  formData.append("mode", "preview");

  const response = await fetch("/api/tailor", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Something went wrong. Please try again."
    );
  }

  return response.json();
}

export async function finalizeResume(
  file: File,
  jobDescription: string,
  acceptedReplacements: Record<string, string>
): Promise<{ downloadUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);
  formData.append("mode", "finalize");
  formData.append("acceptedReplacements", JSON.stringify(acceptedReplacements));

  const response = await fetch("/api/tailor", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Something went wrong. Please try again."
    );
  }

  const blob = await response.blob();
  const downloadUrl = createBlobUrl(blob);
  const fileName = generateTailoredFileName(file.name);

  return { downloadUrl, fileName };
}

export async function oneClickTailor(
  file: File,
  jobDescription: string
): Promise<{ downloadUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);

  const response = await fetch("/api/tailor", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "Something went wrong. Please try again."
    );
  }

  const blob = await response.blob();
  const downloadUrl = createBlobUrl(blob);
  const fileName = generateTailoredFileName(file.name);

  return { downloadUrl, fileName };
}
