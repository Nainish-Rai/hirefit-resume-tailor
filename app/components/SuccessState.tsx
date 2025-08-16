import type { ProcessingStatus } from "../types";
import { downloadFile } from "../utils/file-utils";

interface SuccessStateProps {
  status: ProcessingStatus;
  onStartOver: () => void;
}

export function SuccessState({ status, onStartOver }: SuccessStateProps) {
  function handleDownload() {
    if (status.downloadUrl && status.fileName) {
      downloadFile(status.downloadUrl, status.fileName);
    }
  }

  return (
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
            onClick={onStartOver}
            className="border border-slate-300 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
