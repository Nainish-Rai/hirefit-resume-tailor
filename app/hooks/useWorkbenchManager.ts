import type { WorkbenchLine } from "../types";

export function useWorkbenchManager(
  workbench: WorkbenchLine[] | null,
  setWorkbench: (workbench: WorkbenchLine[] | null) => void
) {
  function updateChoice(idx: number, choice: WorkbenchLine["choice"]) {
    if (!workbench) return;
    setWorkbench(
      workbench.map((l) =>
        l.index === idx
          ? {
              ...l,
              choice,
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

  const matchScore = workbench
    ? Math.round(
        (workbench.filter((l) => l.choice === "suggested").length /
          workbench.length) *
          100
      )
    : 0;

  const acceptedCount = workbench
    ? workbench.filter((l) => l.choice === "suggested").length
    : 0;

  const customCount = workbench
    ? workbench.filter((l) => l.choice === "custom").length
    : 0;

  const originalCount = workbench
    ? workbench.filter((l) => l.choice === "original").length
    : 0;

  return {
    updateChoice,
    updateCustomText,
    acceptAll,
    useOriginals,
    matchScore,
    acceptedCount,
    customCount,
    originalCount,
  };
}
