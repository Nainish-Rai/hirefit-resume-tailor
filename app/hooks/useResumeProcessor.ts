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
  const [rerollInProgress, setRerollInProgress] = useState<Set<number>>(
    new Set()
  );

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
    setRerollInProgress(new Set());
    resetStatus();
  }

  async function handlePreview() {
    if (!file || !jobDescription.trim()) return;

    resetStatus();
    setStatus({ state: "uploading", message: "Uploading your resume..." });

    try {
      setStatus({
        state: "processing",
        message: "AI is analyzing your experience and job requirements...",
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

  async function handleRerollLine(lineIndex: number) {
    if (!file || !workbench || rerollInProgress.has(lineIndex)) return;

    setRerollInProgress((prev) => new Set(prev).add(lineIndex));

    try {
      // Simulate re-roll API call - you'll need to implement this endpoint
      const response = await fetch("/api/tailor/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: workbench[lineIndex].originalText,
          jobDescription,
          lineIndex,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate alternative");

      const { suggestedText } = await response.json();

      setWorkbench((prev) =>
        prev
          ? prev.map((line) =>
              line.index === lineIndex
                ? { ...line, suggestedText, choice: "suggested" as const }
                : line
            )
          : prev
      );
    } catch (error) {
      console.error("Re-roll error:", error);
      // For now, just generate a variation of the current suggestion
      setWorkbench((prev) =>
        prev
          ? prev.map((line) =>
              line.index === lineIndex
                ? {
                    ...line,
                    suggestedText:
                      line.suggestedText + " [Alternative version]",
                    choice: "suggested" as const,
                  }
                : line
            )
          : prev
      );
    } finally {
      setRerollInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lineIndex);
        return newSet;
      });
    }
  }

  async function handleFinalize() {
    if (!file || !workbench) return;

    setStatus({
      state: "processing",
      message: "Applying your changes and generating the final document...",
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
        message: "Your tailored resume is ready for download!",
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
        message: "AI is automatically tailoring your entire resume...",
      });

      const { downloadUrl, fileName } = await oneClickTailor(
        file,
        jobDescription
      );

      setStatus({
        state: "success",
        message: "Your resume has been successfully tailored and is ready!",
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
    rerollInProgress,
    resetStatus,
    resetAll,
    handlePreview,
    handleFinalize,
    handleOneClickTailor,
    handleRerollLine,
  };
}
