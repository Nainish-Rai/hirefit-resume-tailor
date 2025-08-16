import { useState } from "react";
import { VisualDiff } from "./VisualDiff";
import type { WorkbenchLine } from "../types";

interface ResumeEditorPanelProps {
  workbench: WorkbenchLine[];
  rerollInProgress: Set<number>;
  onUpdateChoice: (idx: number, choice: WorkbenchLine["choice"]) => void;
  onUpdateCustomText: (idx: number, text: string) => void;
  onAcceptAll: () => void;
  onUseOriginals: () => void;
  onRerollLine: (idx: number) => void;
}

interface LineActionsProps {
  line: WorkbenchLine;
  isRerolling: boolean;
  onAccept: () => void;
  onReject: () => void;
  onReroll: () => void;
  onEdit: () => void;
}

function LineActions({
  line,
  isRerolling,
  onAccept,
  onReject,
  onReroll,
  onEdit,
}: LineActionsProps) {
  const isOriginal = line.choice === "original";
  const isSuggested = line.choice === "suggested";
  const isCustom = line.choice === "custom";

  return (
    <div className="flex items-center gap-2">
      {!isOriginal && (
        <button
          onClick={onAccept}
          disabled={isRerolling}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Accept AI suggestion"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Accept
        </button>
      )}

      {!isOriginal && (
        <button
          onClick={onReject}
          disabled={isRerolling}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reject and use original"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Reject
        </button>
      )}

      {isSuggested && line.originalText !== line.suggestedText && (
        <button
          onClick={onReroll}
          disabled={isRerolling}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate alternative suggestion"
        >
          {isRerolling ? (
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {isRerolling ? "Re-rolling..." : "Re-roll"}
        </button>
      )}

      <button
        onClick={onEdit}
        disabled={isRerolling}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title="Edit manually"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        Edit
      </button>
    </div>
  );
}

export function ResumeEditorPanel({
  workbench,
  rerollInProgress,
  onUpdateChoice,
  onUpdateCustomText,
  onAcceptAll,
  onUseOriginals,
  onRerollLine,
}: ResumeEditorPanelProps) {
  const [expandedLine, setExpandedLine] = useState<number | null>(null);

  const handleAccept = (lineIndex: number) => {
    onUpdateChoice(lineIndex, "suggested");
  };

  const handleReject = (lineIndex: number) => {
    onUpdateChoice(lineIndex, "original");
  };

  const handleReroll = (lineIndex: number) => {
    onRerollLine(lineIndex);
  };

  const handleEdit = (lineIndex: number) => {
    const line = workbench[lineIndex];
    onUpdateChoice(lineIndex, "custom");
    if (!line.customText) {
      onUpdateCustomText(lineIndex, line.suggestedText);
    }
    setExpandedLine(lineIndex);
  };

  const changedLines = workbench.filter(
    (line) => line.originalText !== line.suggestedText
  );
  const acceptedSuggestions = workbench.filter(
    (line) => line.choice === "suggested"
  ).length;
  const customEdits = workbench.filter(
    (line) => line.choice === "custom"
  ).length;

  return (
    <div className="col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Resume Editor
            </h2>
            <p className="text-sm text-slate-600">
              {changedLines.length} AI suggestions • {acceptedSuggestions}{" "}
              accepted • {customEdits} custom edits
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAcceptAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Accept All
            </button>
            <button
              onClick={onUseOriginals}
              className="px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-slate-100">
          {workbench.map((line) => {
            const hasChanges = line.originalText !== line.suggestedText;
            const isExpanded = expandedLine === line.index;
            const isCustom = line.choice === "custom";
            const isRerolling = rerollInProgress.has(line.index);

            return (
              <div
                key={line.index}
                className={`p-4 transition-colors ${
                  hasChanges ? "hover:bg-slate-50" : "bg-slate-25"
                } ${isRerolling ? "bg-blue-50" : ""}`}
              >
                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isRerolling
                          ? "bg-blue-500 animate-pulse"
                          : line.choice === "original"
                          ? "bg-slate-400"
                          : line.choice === "suggested"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-600">
                      Line {line.index + 1}
                      {isRerolling && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                          Generating alternative...
                        </span>
                      )}
                      {hasChanges && !isRerolling && (
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                            line.choice === "original"
                              ? "bg-slate-100 text-slate-600"
                              : line.choice === "suggested"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {line.choice === "original"
                            ? "Original"
                            : line.choice === "suggested"
                            ? "AI Enhanced"
                            : "Custom Edit"}
                        </span>
                      )}
                    </span>
                  </div>

                  {hasChanges && (
                    <LineActions
                      line={line}
                      isRerolling={isRerolling}
                      onAccept={() => handleAccept(line.index)}
                      onReject={() => handleReject(line.index)}
                      onReroll={() => handleReroll(line.index)}
                      onEdit={() => handleEdit(line.index)}
                    />
                  )}
                </div>

                {/* Content Display */}
                {isCustom && isExpanded ? (
                  <div className="space-y-3">
                    <textarea
                      value={line.customText || ""}
                      onChange={(e) =>
                        onUpdateCustomText(line.index, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white resize-none"
                      rows={4}
                      placeholder="Enter your custom text..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setExpandedLine(null)}
                        className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setExpandedLine(null)}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Main content with visual diff */}
                    {hasChanges &&
                    line.choice === "suggested" &&
                    !isRerolling ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <VisualDiff
                          originalText={line.originalText}
                          suggestedText={line.suggestedText}
                          className="text-sm font-mono"
                        />
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-lg border text-sm leading-relaxed font-mono ${
                          isRerolling
                            ? "bg-blue-50 border-blue-200 opacity-70"
                            : line.choice === "original" && hasChanges
                            ? "bg-slate-50 border-slate-200"
                            : line.choice === "custom"
                            ? "bg-purple-50 border-purple-200"
                            : !hasChanges
                            ? "bg-slate-25 border-slate-100 text-slate-600"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        {isRerolling ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                            Generating alternative suggestion...
                          </div>
                        ) : line.choice === "original" ? (
                          line.originalText
                        ) : line.choice === "suggested" ? (
                          line.suggestedText
                        ) : (
                          line.customText || line.suggestedText
                        )}
                      </div>
                    )}

                    {/* Show original text for reference when showing suggested */}
                    {hasChanges &&
                      line.choice === "suggested" &&
                      !isRerolling && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                            Show original text
                          </summary>
                          <div className="mt-2 p-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono">
                            {line.originalText}
                          </div>
                        </details>
                      )}
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
