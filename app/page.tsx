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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>({
    state: "idle",
    message: "",
  });

  function resetStatus() {
    setStatus({ state: "idle", message: "" });
  }

  async function handleUpload() {
    if (!file || !jobDescription.trim()) return;

    resetStatus();
    setStatus({ state: "uploading", message: "Uploading your resume..." });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

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
    resetStatus();
  }

  const isProcessing =
    status.state === "uploading" || status.state === "processing";
  const canSubmit = file && jobDescription.trim() && !isProcessing;

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
      <div className="bg-[#FFFFFF] rounded-2xl shadow-lg border border-gray-100 p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
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
          <h1 className="text-2xl font-medium text-[#000000] mb-2">
            HireFit Resume Tailor
          </h1>
          <p className="text-[#6B6B6B] text-sm">
            AI-powered resume optimization for every opportunity
          </p>
        </div>

        {/* Success State */}
        {status.state === "success" && (
          <div className="mb-8 p-6 bg-[#F7F7F7] rounded-xl border border-green-100">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center mr-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
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
              <h3 className="font-medium text-[#000000]">
                Resume Tailored Successfully
              </h3>
            </div>
            <p className="text-[#6B6B6B] text-sm mb-4">{status.message}</p>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 bg-[#000000] text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Download Tailored Resume
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-[#F7F7F7] transition-colors font-medium text-sm text-[#6B6B6B]"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status.state === "error" && (
          <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-[#FF4D4D] rounded-full flex items-center justify-center mr-3">
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
              <h3 className="font-medium text-red-800">Processing Failed</h3>
            </div>
            <p className="text-red-700 text-sm mb-3">{status.message}</p>
            <button
              onClick={resetStatus}
              className="text-sm text-red-700 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mb-8 p-6 bg-[#F7F7F7] rounded-xl">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 border-2 border-[#F9A825] border-t-transparent rounded-full animate-spin mr-3"></div>
              <h3 className="font-medium text-[#000000]">
                Processing Your Resume
              </h3>
            </div>
            <p className="text-[#6B6B6B] text-sm mb-4">{status.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#F9A825] to-[#4CAF50] h-2 rounded-full animate-pulse"
                style={{ width: status.state === "uploading" ? "30%" : "70%" }}
              ></div>
            </div>
          </div>
        )}

        {/* Input Form */}
        {(status.state === "idle" || status.state === "error") && (
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-3">
                Upload Resume
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-colors
                  ${
                    file
                      ? "border-[#4CAF50] bg-green-50"
                      : "border-gray-200 hover:border-gray-300 bg-[#F7F7F7]"
                  }
                `}
                >
                  {file ? (
                    <div className="flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-[#4CAF50] mr-2"
                      >
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-medium text-[#4CAF50]">
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
                        className="text-[#6B6B6B] mx-auto mb-2"
                      >
                        <path
                          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-sm text-[#6B6B6B] mb-1">
                        <span className="font-medium">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-[#6B6B6B]">
                        DOCX files only, up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-[#000000] mb-3">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for best results..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent resize-none bg-[#F7F7F7] text-[#000000] placeholder-[#6B6B6B] text-sm"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-[#6B6B6B]">
                  Minimum 50 characters required
                </span>
                <span className="text-xs text-[#6B6B6B]">
                  {jobDescription.length} characters
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleUpload}
              disabled={!canSubmit}
              className="w-full bg-[#000000] text-white py-4 px-6 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
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
              Tailor My Resume
            </button>
          </div>
        )}

        {/* How it works */}
        {status.state === "idle" && (
          <div className="mt-8 p-4 bg-[#F7F7F7] rounded-xl">
            <h3 className="text-sm font-medium text-[#000000] mb-3 flex items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="mr-2 text-[#6B6B6B]"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              How it works
            </h3>
            <div className="space-y-2 text-xs text-[#6B6B6B]">
              <div className="flex items-start">
                <span className="w-4 h-4 bg-[#F9A825] text-white rounded-full text-[10px] flex items-center justify-center mr-3 mt-0.5 font-medium">
                  1
                </span>
                <span>Upload your current DOCX resume</span>
              </div>
              <div className="flex items-start">
                <span className="w-4 h-4 bg-[#F9A825] text-white rounded-full text-[10px] flex items-center justify-center mr-3 mt-0.5 font-medium">
                  2
                </span>
                <span>Paste the complete job description</span>
              </div>
              <div className="flex items-start">
                <span className="w-4 h-4 bg-[#4CAF50] text-white rounded-full text-[10px] flex items-center justify-center mr-3 mt-0.5 font-medium">
                  3
                </span>
                <span>AI analyzes and tailors your content to match</span>
              </div>
              <div className="flex items-start">
                <span className="w-4 h-4 bg-[#4CAF50] text-white rounded-full text-[10px] flex items-center justify-center mr-3 mt-0.5 font-medium">
                  4
                </span>
                <span>Download with all formatting preserved</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
