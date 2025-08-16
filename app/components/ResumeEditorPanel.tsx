import type { WorkbenchLine } from "../types";

interface ResumeEditorPanelProps {
  workbench: WorkbenchLine[];
  onUpdateChoice: (idx: number, choice: WorkbenchLine["choice"]) => void;
  onUpdateCustomText: (idx: number, text: string) => void;
  onAcceptAll: () => void;
  onUseOriginals: () => void;
}

export function ResumeEditorPanel({
  workbench,
  onUpdateChoice,
  onUpdateCustomText,
  onAcceptAll,
  onUseOriginals,
}: ResumeEditorPanelProps) {
  return (
    <div className="col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Resume Editor
            </h2>
            <p className="text-sm text-slate-600">Review and edit each line</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAcceptAll}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Accept All
            </button>
            <button
              onClick={onUseOriginals}
              className="px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-slate-100">
          {workbench.map((line) => {
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
                        onChange={() => onUpdateChoice(line.index, "original")}
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
                        onChange={() => onUpdateChoice(line.index, "suggested")}
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
                        onChange={() => onUpdateChoice(line.index, "custom")}
                      />
                      Custom Edit
                    </label>
                  </div>
                </div>

                {line.choice === "custom" ? (
                  <textarea
                    value={line.customText || ""}
                    onChange={(e) =>
                      onUpdateCustomText(line.index, e.target.value)
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
  );
}
