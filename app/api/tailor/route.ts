import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    // Parse form data using native Next.js 15 API
    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const jobDescription = formData.get("jobDescription") as string;

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

    // Phase 4: Whole Resume Processing
    console.log("=== PHASE 4: WHOLE RESUME TAILORING ===");

    // Extract text from docx using JSZip
    const zipFile = await JSZip.loadAsync(fileBuffer);
    const documentXml = await zipFile
      .file("word/document.xml")
      ?.async("string");

    if (!documentXml) {
      throw new Error("Could not read document.xml from docx file");
    }

    // Extract all text content from the resume
    const paragraphMatches = documentXml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);

    if (!paragraphMatches || paragraphMatches.length === 0) {
      throw new Error("No paragraphs found in document");
    }

    console.log(`Found ${paragraphMatches.length} paragraphs in document`);

    // Extract all text from the resume to send to AI
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

    console.log(`Extracted resume text (${resumeText.length} characters)`);

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Create comprehensive prompt for whole resume tailoring
    const prompt = `Please tailor this entire resume to align with the job description provided. Return the complete tailored resume text while maintaining the original structure and formatting cues.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Keep all section headers (Experience, Education, Skills, etc.) exactly as they are
2. Preserve contact information, dates, company names, and job titles
3. Rewrite bullet points and descriptions to highlight relevant skills and experiences from the job description
4. Use keywords and terminology from the job description naturally
5. Maintain the same structure and flow as the original resume
6. Keep the same bullet point format and line breaks
7. Return ONLY the tailored resume text, no explanations or comments
8. Ensure each line of the output corresponds to the original structure

TAILORED RESUME:`;

    // Initialize modifiedDocumentXml with original content
    let modifiedDocumentXml = documentXml;

    try {
      console.log("Sending entire resume to AI for tailoring...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const tailoredResumeText = response.text?.trim();

      if (!tailoredResumeText) {
        throw new Error("AI returned empty response");
      }

      console.log(
        `Received tailored resume (${tailoredResumeText.length} characters)`
      );

      // Split tailored text into lines to match with original paragraphs
      const tailoredLines = tailoredResumeText
        .split("\n")
        .filter((line) => line.trim().length > 0);
      const originalLines = resumeText
        .split("\n")
        .filter((line) => line.trim().length > 0);

      console.log(
        `Original lines: ${originalLines.length}, Tailored lines: ${tailoredLines.length}`
      );

      // Modify original document XML with tailored content
      console.log("Modifying original document XML with tailored content...");
      let lineIndex = 0;

      // Replace text content while preserving XML structure
      const paragraphRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
      let paragraphMatch;
      const replacements = [];

      // First pass: collect all paragraphs with text and their replacements
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

        // Get corresponding tailored line
        const tailoredText =
          lineIndex < tailoredLines.length
            ? tailoredLines[lineIndex]
            : originalText;
        lineIndex++;

        // Escape XML special characters in the tailored text
        const escapedText = tailoredText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

        // Create the replacement paragraph with only the first text run containing content
        let isFirstTextRun = true;
        const modifiedParagraph = fullMatch.replace(
          /<w:t([^>]*)>([^<]*)<\/w:t>/g,
          (textMatch, attributes, textContent) => {
            if (isFirstTextRun && textContent.trim()) {
              // Replace the first text run with tailored content
              isFirstTextRun = false;
              return `<w:t${attributes}>${escapedText}</w:t>`;
            } else if (textContent.trim()) {
              // Clear subsequent text runs but keep the formatting tags
              return `<w:t${attributes}></w:t>`;
            }
            return textMatch;
          }
        );

        replacements.push({
          original: fullMatch,
          modified: modifiedParagraph,
        });
      }

      // Second pass: apply all replacements
      for (const replacement of replacements) {
        modifiedDocumentXml = modifiedDocumentXml.replace(
          replacement.original,
          replacement.modified
        );
      }

      console.log("Document XML modification complete.");
    } catch (error) {
      console.error("Failed to process resume with AI:", error);
      throw new Error("Failed to tailor resume. Please try again.");
    }

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
      const closeTags = (modifiedDocumentXml.match(/<\/w:p>/g) || []).length;

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
    return new NextResponse(modifiedBuffer, {
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
    console.error("Error processing docx file:", error);
    return NextResponse.json(
      { error: "Failed to process the document" },
      { status: 500 }
    );
  }
}
