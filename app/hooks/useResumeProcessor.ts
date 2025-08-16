import { useState } from "react";
import type { ProcessingStatus, WorkbenchLine, ApiResponse } from "../types";
import {
  previewResume,
  finalizeResume,
  oneClickTailor,
} from "../services/resume-api";
import { revokeBlobUrl } from "../utils/file-utils";

export function useResumeProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>({
    state: "idle",
    message: "",
  });
  const [workbench, setWorkbench] = useState<WorkbenchLine[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  const isProcessing =
    status.state === "uploading" || status.state === "processing";
  const canSubmit = Boolean(file && jobDescription.trim() && !isProcessing);

  function resetStatus() {
    setStatus({ state: "idle", message: "" });
  }

  function resetAll() {
    if (status.downloadUrl) {
      revokeBlobUrl(status.downloadUrl);
    }
    setFile(null);
    setJobDescription("");
    setWorkbench(null);
    setPreviewFileName(null);
    resetStatus();
  }

  async function handlePreview() {
    if (!file || !jobDescription.trim()) return;

    resetStatus();
    setStatus({ state: "uploading", message: "Uploading your resume..." });

    try {
      setStatus({
        state: "processing",
        message: "AI is analyzing and drafting suggestions...",
      });

      const data = await previewResume(file, jobDescription);

      const wb: WorkbenchLine[] = data.lines.map((l) => ({
        index: l.index,
        originalText: l.originalText,
        suggestedText: l.suggestedText,
        choice:
          l.suggestedText.trim() !== l.originalText.trim()
            ? "suggested"
            : "original",
        customText: l.suggestedText,
      }));

      setWorkbench(wb);
      setPreviewFileName(data.fileName);
      resetStatus();
    } catch (error) {
      console.error("Preview error:", error);
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please check your connection and try again.",
      });
    }
  }

  async function handleFinalize() {
    if (!file || !workbench) return;

    setStatus({
      state: "processing",
      message: "Finalizing and generating DOCX...",
    });

    const acceptedReplacements: Record<string, string> = {};
    for (const line of workbench) {
      let text = line.originalText;
      if (line.choice === "suggested") text = line.suggestedText;
      if (line.choice === "custom")
        text = line.customText || line.suggestedText || line.originalText;

      if (text.trim() !== line.originalText.trim()) {
        acceptedReplacements[String(line.index)] = text;
      }
    }

    try {
      const { downloadUrl, fileName } = await finalizeResume(
        file,
        jobDescription,
        acceptedReplacements
      );

      setStatus({
        state: "success",
        message: "Your tailored resume is ready!",
        downloadUrl,
        fileName,
      });
    } catch (error) {
      console.error("Finalize error:", error);
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please check your connection and try again.",
      });
    }
  }

  async function handleOneClickTailor() {
    if (!file || !jobDescription.trim()) return;

    resetStatus();
    setStatus({ state: "uploading", message: "Uploading your resume..." });

    try {
      setStatus({
        state: "processing",
        message: "AI is tailoring your resume...",
      });

      const { downloadUrl, fileName } = await oneClickTailor(
        file,
        jobDescription
      );

      setStatus({
        state: "success",
        message: "Your resume has been successfully tailored!",
        downloadUrl,
        fileName,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "Network error. Please check your connection and try again.",
      });
    }
  }

  return {
    file,
    setFile,
    jobDescription,
    setJobDescription,
    status,
    workbench,
    setWorkbench,
    previewFileName,
    isProcessing,
    canSubmit,
    resetStatus,
    resetAll,
    handlePreview,
    handleFinalize,
    handleOneClickTailor,
  };
}
