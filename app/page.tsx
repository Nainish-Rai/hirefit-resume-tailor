"use client";

import { useState } from "react";

type ProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

interface ProcessingStatus {
  state: ProcessingState;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

type WorkbenchLine = {
  index: number;
  originalText: string;
  suggestedText: string;
  choice: "original" | "suggested" | "custom";
  customText?: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>({
    state: "idle",
    message: "",
  });
  const [workbench, setWorkbench] = useState<WorkbenchLine[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  function resetStatus() {
    setStatus({ state: "idle", message: "" });
  }

  function resetAll() {
    if (status.downloadUrl) {
      window.URL.revokeObjectURL(status.downloadUrl);
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
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      formData.append("mode", "preview");

      setStatus({
        state: "processing",
        message: "AI is analyzing and drafting suggestions...",
      });

      const response = await fetch("/api/tailor", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus({
          state: "error",
          message: errorData.error || "Something went wrong. Please try again.",
        });
        return;
      }

      const data: {
        fileName: string;
        totalLines: number;
        lines: { index: number; originalText: string; suggestedText: string }[];
      } = await response.json();

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
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  async function handleFinalize() {
    if (!file || !workbench) return;

    setStatus({
      state: "processing",
      message: "Finalizing and generating DOCX...",
    });

    const accepted: Record<string, string> = {};
    for (const line of workbench) {
      let text = line.originalText;
      if (line.choice === "suggested") text = line.suggestedText;
      if (line.choice === "custom")
        text = line.customText || line.suggestedText || line.originalText;
      // Only include changes to minimize payload
      if (text.trim() !== line.originalText.trim()) {
        accepted[String(line.index)] = text;
      }
    }

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      formData.append("mode", "finalize");
      formData.append("acceptedReplacements", JSON.stringify(accepted));

      const response = await fetch("/api/tailor", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const outFileName = (previewFileName || file.name).replace(
          ".docx",
          "_tailored.docx"
        );
        setStatus({
          state: "success",
          message: "Your tailored resume is ready!",
          downloadUrl: url,
          fileName: outFileName,
        });
      } else {
        const errorData = await response.json();
        setStatus({
          state: "error",
          message: errorData.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Finalize error:", error);
      setStatus({
        state: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  async function handleOneClickTailor() {
    // Preserve original one-click flow (direct DOCX)
    if (!file || !jobDescription.trim()) return;

    resetStatus();
    setStatus({ state: "uploading", message: "Uploading your resume..." });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      // No mode => default docx path

      setStatus({
        state: "processing",
        message: "AI is tailoring your resume...",
      });

      const response = await fetch("/api/tailor", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const fileName = file.name.replace(".docx", "_tailored.docx");
        setStatus({
          state: "success",
          message: "Your resume has been successfully tailored!",
          downloadUrl: url,
          fileName,
        });
      } else {
        const errorData = await response.json();
        setStatus({
          state: "error",
          message: errorData.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus({
        state: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  function handleDownload() {
    if (status.downloadUrl && status.fileName) {
      const a = document.createElement("a");
      a.href = status.downloadUrl;
      a.download = status.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(status.downloadUrl);
      document.body.removeChild(a);
    }
  }

  function handleStartOver() {
    if (status.downloadUrl) {
      window.URL.revokeObjectURL(status.downloadUrl);
    }
    setFile(null);
    setJobDescription("");
    setWorkbench(null);
    setPreviewFileName(null);
    resetStatus();
  }

  const isProcessing =
    status.state === "uploading" || status.state === "processing";
  const canSubmit = file && jobDescription.trim() && !isProcessing;

  function updateChoice(idx: number, choice: WorkbenchLine["choice"]) {
    if (!workbench) return;
    setWorkbench(
      workbench.map((l) =>
        l.index === idx
          ? {
              ...l,
              choice,
              // if switching to custom with no text, prefill with suggested
              customText:
                choice === "custom"
                  ? l.customText || l.suggestedText
                  : l.customText,
            }
          : l
      )
    );
  }

  function updateCustomText(idx: number, text: string) {
    if (!workbench) return;
    setWorkbench(
      workbench.map((l) => (l.index === idx ? { ...l, customText: text } : l))
    );
  }

  function acceptAll() {
    if (!workbench) return;
    setWorkbench(workbench.map((l) => ({ ...l, choice: "suggested" })));
  }

  function useOriginals() {
    if (!workbench) return;
    setWorkbench(workbench.map((l) => ({ ...l, choice: "original" })));
  }

  return (
    <div className=" h-full min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">HireFit</h1>
              <p className="text-sm text-slate-600">Resume Tailor</p>
            </div>
          </div>

          {status.state === "success" && (
            <button
              onClick={handleStartOver}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Start New Project
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Initial Upload State */}
        {!workbench &&
          (status.state === "idle" || status.state === "error") && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  AI-Powered Resume Optimization
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Upload your resume and job description to get personalized
                  suggestions that help you stand out to hiring managers.
                </p>
              </div>

              {/* Error State */}
              {status.state === "error" && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="font-medium text-red-800">
                      Processing Failed
                    </h3>
                  </div>
                  <p className="text-red-700 text-sm mb-3">{status.message}</p>
                  <button
                    onClick={() => setStatus({ state: "idle", message: "" })}
                    className="text-sm text-red-700 hover:text-red-800 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Resume (DOCX)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".docx"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className={`${
                        file
                          ? "border-green-300 bg-green-50"
                          : "border-slate-300 hover:border-slate-400 bg-slate-50"
                      } border-2 border-dashed rounded-lg p-6 text-center transition-colors`}
                    >
                      {file ? (
                        <div className="flex items-center justify-center">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-green-600 mr-2"
                          >
                            <path
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-sm font-medium text-green-700">
                            {file.name}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-slate-400 mx-auto mb-3"
                          >
                            <path
                              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="text-sm text-slate-600 mb-1">
                            <span className="font-medium">Click to upload</span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">
                            DOCX files only, up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for best results..."
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-slate-900 placeholder-slate-500 text-sm leading-relaxed font-mono"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">
                      Minimum 50 characters required
                    </span>
                    <span className="text-xs text-slate-500">
                      {jobDescription.length} characters
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                  <button
                    onClick={handlePreview}
                    disabled={!canSubmit}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mr-2"
                    >
                      <path
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Preview & Edit Suggestions
                  </button>
                  <button
                    onClick={handleOneClickTailor}
                    disabled={!canSubmit}
                    className="flex-1 border border-slate-300 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    One-Click Auto-Tailor
                  </button>
                </div>
              </div>

              {/* How it works */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  How It Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-semibold">
                        1
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          Upload Resume
                        </h4>
                        <p className="text-sm text-slate-600">
                          Upload your current DOCX resume
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-semibold">
                        2
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          Add Job Description
                        </h4>
                        <p className="text-sm text-slate-600">
                          Paste the complete job posting
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-semibold">
                        3
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900">
                          Review Suggestions
                        </h4>
                        <p className="text-sm text-slate-600">
                          Edit AI suggestions line-by-line
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center mr-3 mt-0.5 font-semibold">
                        4
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900">Download</h4>
                        <p className="text-sm text-slate-600">
                          Get your tailored resume with formatting preserved
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Processing State */}
        {(status.state === "uploading" || status.state === "processing") && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Processing Your Resume
              </h3>
              <p className="text-slate-600 mb-6">{status.message}</p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: status.state === "uploading" ? "30%" : "70%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {status.state === "success" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-green-600"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Resume Tailored Successfully
              </h3>
              <p className="text-slate-600 mb-6">{status.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Download Tailored Resume
                </button>
                <button
                  onClick={handleStartOver}
                  className="border border-slate-300 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Three-Column Workbench Layout */}
        {workbench &&
          status.state !== "processing" &&
          status.state !== "uploading" &&
          status.state !== "success" && (
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
              {/* Left Column - Job Description */}
              <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Job Description
                  </h2>
                  <p className="text-sm text-slate-600">
                    Reference for tailoring
                  </p>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono">
                      {jobDescription}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Middle Column - Resume Editor */}
              <div className="col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Resume Editor
                      </h2>
                      <p className="text-sm text-slate-600">
                        Review and edit each line
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={acceptAll}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        Accept All
                      </button>
                      <button
                        onClick={useOriginals}
                        className="px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="divide-y divide-slate-100">
                    {workbench.map((line, index) => {
                      const selectedText =
                        line.choice === "original"
                          ? line.originalText
                          : line.choice === "suggested"
                          ? line.suggestedText
                          : line.customText || line.suggestedText;

                      return (
                        <div
                          key={line.index}
                          className="p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="mb-3">
                            <div className="flex gap-2 mb-2">
                              <label
                                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                  line.choice === "original"
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`choice-${line.index}`}
                                  className="hidden"
                                  checked={line.choice === "original"}
                                  onChange={() =>
                                    updateChoice(line.index, "original")
                                  }
                                />
                                Original
                              </label>
                              <label
                                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                  line.choice === "suggested"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`choice-${line.index}`}
                                  className="hidden"
                                  checked={line.choice === "suggested"}
                                  onChange={() =>
                                    updateChoice(line.index, "suggested")
                                  }
                                />
                                AI Suggestion
                              </label>
                              <label
                                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                  line.choice === "custom"
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`choice-${line.index}`}
                                  className="hidden"
                                  checked={line.choice === "custom"}
                                  onChange={() =>
                                    updateChoice(line.index, "custom")
                                  }
                                />
                                Custom Edit
                              </label>
                            </div>
                          </div>

                          {line.choice === "custom" ? (
                            <textarea
                              value={line.customText || ""}
                              onChange={(e) =>
                                updateCustomText(line.index, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white resize-none"
                              rows={3}
                            />
                          ) : (
                            <div
                              className={`p-3 rounded-lg border text-sm leading-relaxed ${
                                line.choice === "original"
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-blue-50 border-blue-200"
                              }`}
                            >
                              <div className="whitespace-pre-wrap font-mono">
                                {selectedText}
                              </div>
                            </div>
                          )}

                          {line.originalText !== line.suggestedText && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                              <span className="font-medium text-amber-800">
                                Original:
                              </span>
                              <div className="mt-1 text-amber-700 font-mono">
                                {line.originalText}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Actions & Score */}
              <div className="col-span-3 space-y-6">
                {/* Actions Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleFinalize}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                    >
                      Finalize & Download
                    </button>
                    <button
                      onClick={() => setWorkbench(null)}
                      className="w-full border border-slate-300 text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors font-semibold text-sm"
                    >
                      Back to Upload
                    </button>
                  </div>
                </div>

                {/* Resume Score Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Resume Score
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Match Score
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {workbench
                            ? Math.round(
                                (workbench.filter(
                                  (l) => l.choice === "suggested"
                                ).length /
                                  workbench.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: workbench
                              ? `${
                                  (workbench.filter(
                                    (l) => l.choice === "suggested"
                                  ).length /
                                    workbench.length) *
                                  100
                                }%`
                              : "0%",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>AI Suggestions Accepted:</span>
                        <span className="font-medium">
                          {workbench
                            ? workbench.filter((l) => l.choice === "suggested")
                                .length
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custom Edits:</span>
                        <span className="font-medium">
                          {workbench
                            ? workbench.filter((l) => l.choice === "custom")
                                .length
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Original Text:</span>
                        <span className="font-medium">
                          {workbench
                            ? workbench.filter((l) => l.choice === "original")
                                .length
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips Card */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 Pro Tips
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Use job keywords in your descriptions</li>
                    <li>• Quantify achievements with numbers</li>
                    <li>• Keep bullet points concise and action-oriented</li>
                    <li>• Review each suggestion carefully</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
