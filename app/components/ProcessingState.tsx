import type { ProcessingStatus } from "../types";

interface ProcessingStateProps {
  status: ProcessingStatus;
}

export function ProcessingState({ status }: ProcessingStateProps) {
  return (
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
  );
}
