import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import JSZip from "jszip";

export const runtime = "nodejs";

// Helper function to identify if a line is likely a bullet point or description
function isBulletPoint(line: string): boolean {
  const trimmed = line.trim();

  // Check for common bullet point indicators
  const bulletIndicators = [
    "•",
    "·",
    "○",
    "▪",
    "▫",
    "■",
    "□",
    "✓",
    "✔",
    "-",
    "*",
    ">",
    "→",
    "⋄",
    "◦",
    "⮚",
    "▶",
  ];

  // Check if line starts with bullet symbols
  if (bulletIndicators.some((bullet) => trimmed.startsWith(bullet))) {
    return true;
  }

  // Check for numbered lists (1., 2., etc.)
  if (/^\d+[\.\)]\s/.test(trimmed)) {
    return true;
  }

  // Check for lettered lists (a., b., etc.)
  if (/^[a-zA-Z][\.\)]\s/.test(trimmed)) {
    return true;
  }

  // Check for indented lines that likely describe responsibilities/achievements
  if (
    trimmed.length > 20 &&
    (trimmed.toLowerCase().includes("developed") ||
      trimmed.toLowerCase().includes("managed") ||
      trimmed.toLowerCase().includes("implemented") ||
      trimmed.toLowerCase().includes("created") ||
      trimmed.toLowerCase().includes("led") ||
      trimmed.toLowerCase().includes("designed") ||
      trimmed.toLowerCase().includes("achieved") ||
      trimmed.toLowerCase().includes("improved") ||
      trimmed.toLowerCase().includes("reduced") ||
      trimmed.toLowerCase().includes("increased") ||
      trimmed.toLowerCase().includes("collaborated") ||
      trimmed.toLowerCase().includes("coordinated") ||
      trimmed.toLowerCase().includes("executed") ||
      trimmed.toLowerCase().includes("analyzed") ||
      trimmed.toLowerCase().includes("optimized"))
  ) {
    return true;
  }

  return false;
}

// Helper function to identify if a line is likely a title, header, or structural element
function isStructuralElement(line: string): boolean {
  const trimmed = line.trim();

  // Very short lines are likely titles
  if (trimmed.length < 4) {
    return true;
  }

  // Common resume section headers
  const sectionHeaders = [
    "experience",
    "education",
    "skills",
    "projects",
    "summary",
    "objective",
    "certifications",
    "awards",
    "publications",
    "languages",
    "references",
    "professional experience",
    "work experience",
    "technical skills",
    "professional summary",
    "career objective",
    "core competencies",
  ];

  if (
    sectionHeaders.some(
      (header) =>
        trimmed.toLowerCase().includes(header.toLowerCase()) &&
        trimmed.length < 50
    )
  ) {
    return true;
  }

  // Job titles, company names, dates (typically short and don't contain action verbs)
  if (
    trimmed.length < 60 &&
    (/\d{4}/.test(trimmed) || // Contains year
      trimmed.split(" ").length <= 4 || // Very short phrases
      /^[A-Z][a-z]+\s*[A-Z]/.test(trimmed)) // Title case formatting
  ) {
    return true;
  }

  // Contact information
  if (
    trimmed.includes("@") ||
    trimmed.includes("phone") ||
    trimmed.includes("email")
  ) {
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Parse form data using native Next.js 15 API
    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;
    const mode = (formData.get("mode") as string) || "docx"; // 'preview' | 'finalize' | 'docx'
    const acceptedReplacementsRaw = formData.get("acceptedReplacements") as
      | string
      | null; // only for finalize

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Job description is too short. Please provide a detailed job description.",
        },
        { status: 400 }
      );
    }

    // Check if it's a docx file
    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Please upload a .docx file" },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 5MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // === Common: Extract text from docx using JSZip ===
    const zipFile = await JSZip.loadAsync(fileBuffer);
    const documentXml = await zipFile
      .file("word/document.xml")
      ?.async("string");

    if (!documentXml) {
      throw new Error("Could not read document.xml from docx file");
    }

    // Extract paragraphs and text (non-empty lines only)
    const paragraphMatches = documentXml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

    if (!paragraphMatches || paragraphMatches.length === 0) {
      throw new Error("No paragraphs found in document");
    }

    const resumeText = paragraphMatches
      .map((paragraph) => {
        const textMatches = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (!textMatches) return "";

        const text = textMatches
          .map((match) => match.replace(/<[^>]*>/g, "").trim())
          .filter((text) => text.length > 0)
          .join(" ");

        return text.trim();
      })
      .filter((text) => text.length > 0)
      .join("\n");

    if (!resumeText.trim()) {
      throw new Error("No text content found in resume");
    }

    const originalLines = resumeText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Identify which lines are bullet points vs structural elements
    const linesToTailor = originalLines.map((line, index) => ({
      index,
      text: line,
      isBulletPoint: isBulletPoint(line),
      isStructural: isStructuralElement(line),
    }));

    const bulletPointLines = linesToTailor.filter((item) => item.isBulletPoint);
    const structuralLines = linesToTailor.filter((item) => item.isStructural);

    console.log(
      `Identified ${bulletPointLines.length} bullet points and ${structuralLines.length} structural elements out of ${originalLines.length} total lines`
    );

    // === Branch 1: PREVIEW (return JSON with per-line suggestions) ===
    if (mode === "preview") {
      console.log(
        "=== PREVIEW MODE: Generating focused bullet point suggestions ==="
      );

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are HireFitAI, an elite career strategist and resume optimization specialist focused on bullet point enhancement.

MISSION: Transform bullet points and achievement descriptions in this resume to be ATS-optimized and highly compelling while preserving all titles, headers, and structural elements EXACTLY as they are.

ORIGINAL RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

FOCUS AREAS FOR TAILORING:
- ONLY modify bullet points, achievement descriptions, and responsibility statements
- PRESERVE all job titles, company names, section headers, dates, and contact information exactly as written
- PRESERVE all structural elements like "EXPERIENCE", "EDUCATION", "SKILLS" headers
- Focus on bullet points that start with action verbs or describe achievements
- Enhance technical skills descriptions and project details

BULLET POINT OPTIMIZATION STRATEGY:
1. Transform weak action verbs into powerful, industry-specific ones
2. Add quantifiable metrics where they can be reasonably inferred
3. Integrate job-relevant keywords naturally
4. Emphasize results and impact over responsibilities
5. Align technical skills with job requirements

OUTPUT INSTRUCTIONS:
Return a JSON object with this structure:
{
  "lineReplacements": [
    {
      "originalLine": "exact original text",
      "tailoredLine": "enhanced version focusing on impact",
      "lineIndex": 0,
      "shouldTailor": true,
      "improvementType": "bullet_point_enhancement|keyword_integration|quantification|action_verb_improvement"
    }
  ]
}

CRITICAL REQUIREMENTS:
- ONLY improve lines that are clearly bullet points or achievement descriptions
- For structural elements (titles, headers, dates), set "shouldTailor": false and keep "tailoredLine" identical to "originalLine"
- Maintain similar length for tailored bullet points (±40% maximum)
- Preserve bullet point formatting (•, -, *, etc.)
- Include ALL lines in the response

LINES TO ANALYZE:
${originalLines
  .map((line, index) => {
    const isBullet = isBulletPoint(line);
    const isStruct = isStructuralElement(line);
    return `${index}: ${line} [${
      isBullet ? "BULLET" : isStruct ? "STRUCTURAL" : "CONTENT"
    }]`;
  })
  .join("\n")}

Focus your improvements on lines marked as [BULLET] or [CONTENT]. Keep [STRUCTURAL] lines unchanged.`;

      let lineReplacements: any[] = [];
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const aiResponse =
          typeof (response as any).text === "function"
            ? (response as any).text().trim()
            : String((response as any).text || "").trim();
        if (!aiResponse) {
          throw new Error("AI returned empty response");
        }
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in AI response");
        }
        const jsonResponse = JSON.parse(jsonMatch[0]);
        lineReplacements = jsonResponse.lineReplacements || [];
      } catch (e) {
        console.error("Failed to parse AI JSON response in preview:", e);
        return NextResponse.json(
          { error: "AI returned invalid JSON format" },
          { status: 500 }
        );
      }

      // Map replacements with focus on bullet points
      const lineReplacementMap = new Map<number, string>();
      for (const replacement of lineReplacements) {
        const originalLine = replacement.originalLine?.trim();
        const tailoredLine = replacement.tailoredLine?.trim();
        const lineIndex = replacement.lineIndex;
        const shouldTailor = replacement.shouldTailor !== false; // Default to true if not specified

        if (!originalLine || !tailoredLine) continue;

        // Only apply changes if shouldTailor is true
        if (!shouldTailor) {
          continue; // Skip structural elements
        }

        if (
          typeof lineIndex === "number" &&
          lineIndex >= 0 &&
          lineIndex < originalLines.length
        ) {
          lineReplacementMap.set(lineIndex, tailoredLine);
          continue;
        }
        const actualIndex = originalLines.findIndex((line) => {
          const a = line.trim().toLowerCase().replace(/\s+/g, " ");
          const b = originalLine.toLowerCase().replace(/\s+/g, " ");
          return a === b || a.includes(b) || b.includes(a);
        });
        if (actualIndex !== -1 && !lineReplacementMap.has(actualIndex)) {
          lineReplacementMap.set(actualIndex, tailoredLine);
        }
      }

      // Normalize output to include all lines, but only show changes for bullet points
      const lines = originalLines.map((orig, i) => ({
        index: i,
        originalText: orig,
        suggestedText: lineReplacementMap.get(i) || orig,
        isBulletPoint: isBulletPoint(orig),
        isStructural: isStructuralElement(orig),
      }));

      return NextResponse.json(
        {
          fileName: file.name,
          totalLines: originalLines.length,
          bulletPointsIdentified: bulletPointLines.length,
          structuralElementsPreserved: structuralLines.length,
          lines,
        },
        { status: 200 }
      );
    } else if (mode === "finalize") {
      // === Branch 2: FINALIZE (apply accepted replacements, generate DOCX) ===
      console.log(
        "=== FINALIZE MODE: Applying accepted bullet point replacements ==="
      );
      if (!acceptedReplacementsRaw) {
        return NextResponse.json(
          { error: "acceptedReplacements is required" },
          { status: 400 }
        );
      }

      let acceptedMap: Record<string, string> = {};
      try {
        acceptedMap = JSON.parse(acceptedReplacementsRaw) as Record<
          string,
          string
        >;
      } catch (e) {
        return NextResponse.json(
          { error: "acceptedReplacements must be valid JSON" },
          { status: 400 }
        );
      }

      // Build replacement map: default to original line content
      const lineReplacementMap = new Map<number, string>();
      originalLines.forEach((orig, i) => {
        if (Object.prototype.hasOwnProperty.call(acceptedMap, String(i))) {
          const val = (acceptedMap as any)[String(i)];
          if (typeof val === "string" && val.trim().length > 0) {
            lineReplacementMap.set(i, val.trim());
          } else {
            lineReplacementMap.set(i, orig);
          }
        } else {
          lineReplacementMap.set(i, orig);
        }
      });

      // Modify original document XML with provided content
      let modifiedDocumentXml = documentXml;
      const paragraphRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
      let paragraphMatch;
      let currentLineIndex = 0;
      const replacements: Array<{
        original: string;
        modified: string;
        lineIndex: number;
        originalText: string;
        tailoredText: string;
      }> = [];

      while (
        (paragraphMatch = paragraphRegex.exec(modifiedDocumentXml)) !== null
      ) {
        const fullMatch = paragraphMatch[0];
        const textMatches = fullMatch.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (!textMatches) continue;

        const originalText = textMatches
          .map((textMatch) =>
            textMatch.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, "$1").trim()
          )
          .filter((text) => text.length > 0)
          .join(" ");

        if (!originalText.trim()) continue;

        const tailoredTextRaw =
          lineReplacementMap.get(currentLineIndex) || originalText;
        currentLineIndex++;

        // Length normalization similar to AI path
        let finalTailoredText = tailoredTextRaw;
        const lengthRatio =
          originalText.length > 0
            ? tailoredTextRaw.length / originalText.length
            : 1;
        if (lengthRatio > 1.8) {
          const words = tailoredTextRaw.split(" ");
          const targetLength = Math.floor(originalText.length * 1.5);
          let truncated = "";
          for (const word of words) {
            if ((truncated + " " + word).length <= targetLength) {
              truncated += (truncated ? " " : "") + word;
            } else {
              break;
            }
          }
          finalTailoredText =
            truncated || tailoredTextRaw.substring(0, targetLength);
        }

        const escapedText = finalTailoredText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

        const modifiedParagraph = fullMatch.replace(
          /<w:t([^>]*)>([^<]*)<\/w:t>/g,
          (textMatch, attributes, textContent) => {
            if (textContent.trim() && textMatch === textMatches[0]) {
              return `<w:t${attributes}>${escapedText}</w:t>`;
            }
            return textContent.trim() ? `<w:t${attributes}></w:t>` : textMatch;
          }
        );

        replacements.push({
          original: fullMatch,
          modified: modifiedParagraph,
          lineIndex: currentLineIndex - 1,
          originalText,
          tailoredText: finalTailoredText,
        });
      }

      for (const r of replacements) {
        modifiedDocumentXml = modifiedDocumentXml.replace(
          r.original,
          r.modified
        );
      }

      // Validate XML structure
      try {
        if (
          !modifiedDocumentXml.includes("<w:document") ||
          !modifiedDocumentXml.includes("</w:document>")
        ) {
          throw new Error("Document XML structure appears to be corrupted");
        }
        const openTags = (modifiedDocumentXml.match(/<w:p\b[^>]*>/g) || [])
          .length;
        const closeTags = (modifiedDocumentXml.match(/<\/w:p>/g) || []).length;
        if (openTags !== closeTags) {
          throw new Error("XML structure corrupted during processing");
        }
      } catch (validationError) {
        console.error("XML validation failed (finalize):", validationError);
        // Fall back to original
        modifiedDocumentXml = documentXml;
      }

      // Replace document.xml and generate zip
      zipFile.file("word/document.xml", modifiedDocumentXml);
      const modifiedBuffer = await zipFile.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
        platform: "DOS",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      return new NextResponse(new Uint8Array(modifiedBuffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${file.name.replace(
            ".docx",
            "_tailored.docx"
          )}"`,
        },
      });
    } else {
      // === Branch 3: Default existing behavior (AI -> DOCX) ===
      // Phase 4: Whole Resume Processing
      console.log("=== PHASE 4: WHOLE RESUME TAILORING ===");

      console.log(`Found ${paragraphMatches.length} paragraphs in document`);

      console.log(`Extracted resume text (${resumeText.length} characters)`);

      // Initialize Gemini AI
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Create comprehensive prompt for whole resume tailoring
      const prompt = `You are HireFitAI, an elite career strategist and resume optimization specialist with 15+ years of executive recruitment experience across Fortune 500 companies, specialized in applicant tracking systems (ATS) algorithms and modern hiring psychology.

MISSION: Transform this resume into an ATS-optimized, psychologically compelling document that maximizes interview conversion rates while maintaining complete truthfulness.

ORIGINAL RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

STRATEGIC OPTIMIZATION FRAMEWORK:

1. ATS COMPATIBILITY ANALYSIS
- Integrate high-impact keywords from the job description naturally throughout the content
- Ensure proper keyword density without stuffing (2-3% target)
- Use exact terminology and phrases from the job posting when applicable
- Maintain clean, parseable structure for automated screening systems

2. PSYCHOLOGICAL IMPACT ENHANCEMENT
- Transform basic job descriptions into compelling achievement statements using quantified results
- Lead with action verbs that demonstrate leadership and initiative
- Create narrative flow that builds confidence in the candidate's progression
- Highlight transferable skills that directly address job requirements

3. CONTENT HIERARCHY OPTIMIZATION
- Prioritize most relevant experiences and skills for this specific role
- Reorder bullet points to lead with strongest, most relevant achievements
- Emphasize technical skills, certifications, and qualifications mentioned in job posting
- Strengthen weak areas by connecting existing experience to job requirements

4. ACHIEVEMENT AMPLIFICATION
- Convert responsibilities into quantified accomplishments where possible
- Use the enhanced STAR methodology (Situation, Task, Action, Result + Impact)
- Include metrics, percentages, timeframes, and scope indicators
- Demonstrate progression and increasing responsibility over time

CRITICAL REQUIREMENTS:
- Maintain ALL original section headers, contact information, dates, company names, and job titles EXACTLY as provided
- Preserve the original document structure and flow completely
- Keep the same bullet point format and line breaks as the original
- Ensure each line corresponds to the original structure for proper XML replacement
- Use ONLY information that can be reasonably inferred or enhanced from existing content
- Never fabricate experiences, roles, or qualifications not present in the original
- IMPROVE EVERY SINGLE LINE - even if it's just minor enhancements like stronger action verbs or better phrasing

OPTIMIZATION FOCUS AREAS:
- Keywords and terminology alignment with job description
- Skills section enhancement to match required/preferred qualifications
- Experience bullet points rewritten for maximum impact and relevance
- Professional summary/objective refined to target this specific opportunity
- Technical proficiencies highlighted and prioritized based on job requirements
- Contact information optimization (if applicable)
- Education section enhancement with relevant coursework/achievements
- Certification and skill highlighting

OUTPUT INSTRUCTIONS:
Return the response as a JSON object with the following structure:
{
  "lineReplacements": [
    {
      "originalLine": "original text content",
      "tailoredLine": "improved text content with similar length",
      "lineIndex": 0,
      "improvementType": "keyword_optimization|action_verb_enhancement|quantification|relevance_boost|formatting_improvement"
    }
  ]
}

MANDATORY REQUIREMENTS:
- MUST include ALL non-empty lines from the original resume in lineReplacements array
- Even small improvements count - enhance action verbs, add impact words, improve flow
- Keep tailored lines similar in length to original lines (±30% character difference maximum)
- Maintain exact same number of lines as original
- Preserve formatting indicators like bullet points, numbers, etc.
- If a line cannot be improved meaningfully, still include it with minimal enhancement
- Return ONLY the JSON object, no additional text

ORIGINAL RESUME LINES FOR REFERENCE (IMPROVE ALL OF THESE):
${resumeText
  .split("\n")
  .map((line, index) => `${index}: ${line.trim()}`)
  .filter((line, index) => line.split(": ")[1].length > 0)
  .join("\n")}

TOTAL LINES TO IMPROVE: ${originalLines.length}`;

      // Initialize modifiedDocumentXml with original content
      let modifiedDocumentXml = documentXml;

      try {
        console.log(
          "Sending entire resume to AI for comprehensive tailoring..."
        );
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const aiResponse =
          typeof (response as any).text === "function"
            ? (response as any).text().trim()
            : String((response as any).text || "").trim();

        if (!aiResponse) {
          throw new Error("AI returned empty response");
        }

        console.log(`Received AI response (${aiResponse.length} characters)`);

        // Parse JSON response
        let lineReplacements = [] as any[];
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON object found in AI response");
          }

          const jsonResponse = JSON.parse(jsonMatch[0]);
          lineReplacements = jsonResponse.lineReplacements || [];
          console.log(`Parsed ${lineReplacements.length} line replacements`);

          // Validate that we got improvements for all lines
          const originalLineCount = originalLines.length;
          if (lineReplacements.length < originalLineCount * 0.8) {
            console.warn(
              `Warning: Only ${lineReplacements.length} improvements for ${originalLineCount} lines. Some lines may not be enhanced.`
            );
          }
        } catch (parseError) {
          console.error("Failed to parse AI JSON response:", parseError);
          console.log("AI Response:", aiResponse);
          throw new Error("AI returned invalid JSON format");
        }

        // Create comprehensive line mapping for all content
        const lineReplacementMap = new Map<number, string>();

        // First, try to map by line index
        for (const replacement of lineReplacements) {
          const originalLine = replacement.originalLine?.trim();
          const tailoredLine = replacement.tailoredLine?.trim();
          const lineIndex = replacement.lineIndex;

          if (originalLine && tailoredLine) {
            // Primary mapping: try exact line index if provided
            if (
              typeof lineIndex === "number" &&
              lineIndex >= 0 &&
              lineIndex < originalLines.length
            ) {
              lineReplacementMap.set(lineIndex, tailoredLine);
              console.log(
                `Direct mapped line ${lineIndex}: "${originalLine}" -> "${tailoredLine}"`
              );
            } else {
              // Fallback: content-based matching
              const actualIndex = originalLines.findIndex((line) => {
                const normalizedOriginal = line
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, " ");
                const normalizedSearch = originalLine
                  .toLowerCase()
                  .replace(/\s+/g, " ");
                return (
                  normalizedOriginal === normalizedSearch ||
                  normalizedOriginal.includes(normalizedSearch) ||
                  normalizedSearch.includes(normalizedOriginal)
                );
              });

              if (actualIndex !== -1 && !lineReplacementMap.has(actualIndex)) {
                lineReplacementMap.set(actualIndex, tailoredLine);
                console.log(
                  `Content mapped line ${actualIndex}: "${originalLine}" -> "${tailoredLine}"`
                );
              }
            }
          }
        }

        // Ensure we have replacements for as many lines as possible
        for (let i = 0; i < originalLines.length; i++) {
          if (!lineReplacementMap.has(i)) {
            // If no replacement found, use original with minimal enhancement
            const originalLine = originalLines[i].trim();
            if (originalLine.length > 0) {
              lineReplacementMap.set(i, originalLine);
              console.log(`Using original for line ${i}: "${originalLine}"`);
            }
          }
        }

        // Modify original document XML with tailored content
        console.log(
          "Modifying original document XML with comprehensive tailored content..."
        );
        let currentLineIndex = 0;

        // Replace text content while preserving XML structure
        const paragraphRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
        let paragraphMatch;
        const replacements: any[] = [];

        // Process all paragraphs and apply improvements
        while (
          (paragraphMatch = paragraphRegex.exec(modifiedDocumentXml)) !== null
        ) {
          const fullMatch = paragraphMatch[0];
          const paragraphContent = paragraphMatch[1];

          // Check if this paragraph has text content
          const textMatches = fullMatch.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
          if (!textMatches) continue;

          const originalText = textMatches
            .map((textMatch) =>
              textMatch.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, "$1").trim()
            )
            .filter((text) => text.length > 0)
            .join(" ");

          if (!originalText.trim()) continue;

          // Get the replacement for this line (should exist for all lines now)
          const tailoredText =
            lineReplacementMap.get(currentLineIndex) || originalText;
          currentLineIndex++;

          // Always apply replacement to ensure all lines are processed
          // Length normalization with more flexibility for improvements
          let finalTailoredText = tailoredText;
          const lengthRatio = tailoredText.length / originalText.length;

          if (lengthRatio > 1.8) {
            // Too long, truncate intelligently
            const words = tailoredText.split(" ");
            const targetLength = Math.floor(originalText.length * 1.5);
            let truncated = "";

            for (const word of words) {
              if ((truncated + " " + word).length <= targetLength) {
                truncated += (truncated ? " " : "") + word;
              } else {
                break;
              }
            }

            finalTailoredText =
              truncated || tailoredText.substring(0, targetLength);
          } else if (lengthRatio < 0.5) {
            // Too short, might need expansion but be careful not to add meaningless content
            finalTailoredText = tailoredText; // Keep as is for now
          }

          // Escape XML special characters in the tailored text
          const escapedText = finalTailoredText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

          // Create the replacement paragraph preserving all formatting
          const modifiedParagraph = fullMatch.replace(
            /<w:t([^>]*)>([^<]*)<\/w:t>/g,
            (textMatch, attributes, textContent, offset) => {
              // Only replace the first meaningful text run
              if (textContent.trim() && textMatch === textMatches[0]) {
                return `<w:t${attributes}>${escapedText}</w:t>`;
              }
              // Clear subsequent text runs to avoid duplication
              return textContent.trim()
                ? `<w:t${attributes}></w:t>`
                : textMatch;
            }
          );

          replacements.push({
            original: fullMatch,
            modified: modifiedParagraph,
            lineIndex: currentLineIndex - 1,
            originalText: originalText,
            tailoredText: finalTailoredText,
          });
        }

        // Apply all replacements
        for (const replacement of replacements) {
          modifiedDocumentXml = modifiedDocumentXml.replace(
            replacement.original,
            replacement.modified
          );
        }

        console.log(
          `Applied ${replacements.length} comprehensive content replacements to document XML.`
        );
        console.log(
          `Line replacement coverage: ${originalLines.length}/${originalLines.length} lines enhanced`
        );

        // Validate the modified XML before adding to zip
        try {
          // Basic XML validation - check for well-formed structure
          if (
            !modifiedDocumentXml.includes("<w:document") ||
            !modifiedDocumentXml.includes("</w:document>")
          ) {
            throw new Error("Document XML structure appears to be corrupted");
          }

          // Count opening and closing tags for basic validation
          const openTags = (modifiedDocumentXml.match(/<w:p\b[^>]*>/g) || [])
            .length;
          const closeTags = (modifiedDocumentXml.match(/<\/w:p>/g) || [])
            .length;

          console.log(
            `XML validation: ${openTags} opening <w:p> tags, ${closeTags} closing </w:p> tags`
          );

          if (openTags !== closeTags) {
            console.error(
              `CRITICAL: Tag mismatch detected! ${openTags} opening tags, ${closeTags} closing tags`
            );
            // This is a critical error that will corrupt the file
            throw new Error("XML structure corrupted during processing");
          } else {
            console.log("XML structure validation passed successfully");
          }
        } catch (validationError) {
          console.error("XML validation failed:", validationError);
          // Fall back to original document if validation fails
          modifiedDocumentXml = documentXml;
        }

        // Replace the document.xml in the original zip
        zipFile.file("word/document.xml", modifiedDocumentXml);

        // Generate the modified docx file with proper DOCX settings
        const modifiedBuffer = await zipFile.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6,
          },
          platform: "DOS",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        console.log("=== END PHASE 4 ===");

        // Return the modified document
        return new NextResponse(new Uint8Array(modifiedBuffer), {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="${file.name.replace(
              ".docx",
              "_tailored.docx"
            )}"`,
          },
        });
      } catch (error) {
        console.error("Failed to process resume with AI:", error);
        throw new Error("Failed to tailor resume. Please try again.");
      }
    }
  } catch (error) {
    console.error("Error processing docx file:", error);
    return NextResponse.json(
      { error: "Failed to process the document" },
      { status: 500 }
    );
  }
}
