import { FileUpload } from "./FileUpload";
import { JobDescriptionInput } from "./JobDescriptionInput";
import type { ProcessingStatus } from "../types";

interface UploadFormProps {
  file: File | null;
  jobDescription: string;
  status: ProcessingStatus;
  canSubmit: boolean;
  onFileChange: (file: File | null) => void;
  onJobDescriptionChange: (value: string) => void;
  onPreview: () => void;
  onOneClickTailor: () => void;
  onResetStatus: () => void;
}

export function UploadForm({
  file,
  jobDescription,
  status,
  canSubmit,
  onFileChange,
  onJobDescriptionChange,
  onPreview,
  onOneClickTailor,
  onResetStatus,
}: UploadFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          AI-Powered Resume Optimization
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Upload your resume and job description to get personalized suggestions
          that help you stand out to hiring managers.
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
            <h3 className="font-medium text-red-800">Processing Failed</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">{status.message}</p>
          <button
            onClick={onResetStatus}
            className="text-sm text-red-700 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <FileUpload file={file} onFileChange={onFileChange} />
        <JobDescriptionInput
          value={jobDescription}
          onChange={onJobDescriptionChange}
        />

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row pt-2">
          <button
            onClick={onPreview}
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
            onClick={onOneClickTailor}
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
                <h4 className="font-medium text-slate-900">Upload Resume</h4>
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
  );
}
