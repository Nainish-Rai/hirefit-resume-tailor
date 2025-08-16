interface SidebarPanelProps {
  matchScore: number;
  acceptedCount: number;
  customCount: number;
  originalCount: number;
  onFinalize: () => void;
  onBackToUpload: () => void;
}

export function SidebarPanel({
  matchScore,
  acceptedCount,
  customCount,
  originalCount,
  onFinalize,
  onBackToUpload,
}: SidebarPanelProps) {
  return (
    <div className="col-span-3 space-y-6">
      {/* Actions Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
        <div className="space-y-3">
          <button
            onClick={onFinalize}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
          >
            Finalize & Download
          </button>
          <button
            onClick={onBackToUpload}
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
                {matchScore}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${matchScore}%` }}
              ></div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>AI Suggestions Accepted:</span>
              <span className="font-medium">{acceptedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Custom Edits:</span>
              <span className="font-medium">{customCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Original Text:</span>
              <span className="font-medium">{originalCount}</span>
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
  );
}
