import { useMemo } from "react";

interface DiffSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

interface VisualDiffProps {
  originalText: string;
  suggestedText: string;
  className?: string;
}

function computeWordDiff(original: string, suggested: string): DiffSegment[] {
  const originalWords = original.split(/(\s+)/);
  const suggestedWords = suggested.split(/(\s+)/);

  // Simple word-level diff algorithm
  const segments: DiffSegment[] = [];
  let originalIndex = 0;
  let suggestedIndex = 0;

  while (
    originalIndex < originalWords.length ||
    suggestedIndex < suggestedWords.length
  ) {
    if (originalIndex >= originalWords.length) {
      // Only suggested words left - all additions
      while (suggestedIndex < suggestedWords.length) {
        segments.push({
          type: "added",
          text: suggestedWords[suggestedIndex],
        });
        suggestedIndex++;
      }
    } else if (suggestedIndex >= suggestedWords.length) {
      // Only original words left - all deletions
      while (originalIndex < originalWords.length) {
        segments.push({
          type: "removed",
          text: originalWords[originalIndex],
        });
        originalIndex++;
      }
    } else if (
      originalWords[originalIndex] === suggestedWords[suggestedIndex]
    ) {
      // Words match - unchanged
      segments.push({
        type: "unchanged",
        text: originalWords[originalIndex],
      });
      originalIndex++;
      suggestedIndex++;
    } else {
      // Look ahead to find matching words
      let foundMatch = false;
      for (
        let i = suggestedIndex + 1;
        i < Math.min(suggestedIndex + 5, suggestedWords.length);
        i++
      ) {
        if (originalWords[originalIndex] === suggestedWords[i]) {
          // Found match - mark intermediate words as additions
          while (suggestedIndex < i) {
            segments.push({
              type: "added",
              text: suggestedWords[suggestedIndex],
            });
            suggestedIndex++;
          }
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Look ahead in original for match with current suggested
        for (
          let i = originalIndex + 1;
          i < Math.min(originalIndex + 5, originalWords.length);
          i++
        ) {
          if (originalWords[i] === suggestedWords[suggestedIndex]) {
            // Found match - mark intermediate words as deletions
            while (originalIndex < i) {
              segments.push({
                type: "removed",
                text: originalWords[originalIndex],
              });
              originalIndex++;
            }
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        // No match found - treat as replacement
        segments.push({
          type: "removed",
          text: originalWords[originalIndex],
        });
        segments.push({
          type: "added",
          text: suggestedWords[suggestedIndex],
        });
        originalIndex++;
        suggestedIndex++;
      }
    }
  }

  return segments;
}

export function VisualDiff({
  originalText,
  suggestedText,
  className = "",
}: VisualDiffProps) {
  const diffSegments = useMemo(() => {
    return computeWordDiff(originalText, suggestedText);
  }, [originalText, suggestedText]);

  return (
    <div className={`leading-relaxed ${className}`}>
      {diffSegments.map((segment, index) => {
        if (segment.type === "unchanged") {
          return <span key={index}>{segment.text}</span>;
        } else if (segment.type === "added") {
          return (
            <span
              key={index}
              className="bg-green-100 text-green-800 px-1 rounded-sm font-medium"
              title="Added by AI"
            >
              {segment.text}
            </span>
          );
        } else {
          return (
            <span
              key={index}
              className="bg-red-100 text-red-700 line-through px-1 rounded-sm"
              title="Removed by AI"
            >
              {segment.text}
            </span>
          );
        }
      })}
    </div>
  );
}
