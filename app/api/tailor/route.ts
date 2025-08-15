import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    // Parse form data using native Next.js 15 API
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check if it's a docx file
    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Please upload a .docx file" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Extract text from docx using JSZip for Phase 1
    const zipFile = await JSZip.loadAsync(fileBuffer);
    const documentXml = await zipFile
      .file("word/document.xml")
      ?.async("string");

    if (!documentXml) {
      throw new Error("Could not read document.xml from docx file");
    }

    // Phase 2: Extract specific paragraph and call Gemini AI
    console.log("=== PHASE 2: AI INTEGRATION ===");

    // Extract text content using regex
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);

    if (!textMatches || textMatches.length === 0) {
      console.log("No text content found in document");
      throw new Error("No text content found in document");
    }

    const textElements = textMatches
      .map((match) => match.replace(/<[^>]*>/g, "").trim())
      .filter((text) => text.length > 0);

    console.log(`Found ${textElements.length} text elements`);

    // Get the 10th paragraph (or last available if less than 10)
    const targetIndex = Math.min(9, textElements.length - 1);
    const originalBulletPoint = textElements[targetIndex];

    console.log(
      `Original bullet point (element ${targetIndex}): ${originalBulletPoint}`
    );

    // Hardcoded Job Description for Phase 2
    const jobDescription = `
Software Engineer - Full Stack Developer
We are looking for a passionate Full Stack Developer to join our growing team.
The ideal candidate will have experience with React, Node.js, and TypeScript.
You will be responsible for developing user-facing features, building APIs,
and collaborating with our design team to implement beautiful, responsive interfaces.
Key requirements: 3+ years experience, React/TypeScript skills, API development,
problem-solving abilities, and strong communication skills.
    `.trim();

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Call Gemini API with specific prompt
    const prompt = `Rewrite this resume bullet point: "${originalBulletPoint}" to align with this job description: "${jobDescription}". Return only the rewritten text.`;

    console.log("Calling Gemini API...");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt,
    });

    const rewrittenBulletPoint =
      response.text?.trim() || "No response generated";

    console.log(`Rewritten bullet point: ${rewrittenBulletPoint}`);
    console.log("=== END PHASE 2 ===");

    // For Phase 2, still return the original file unchanged (Phase 3 will modify it)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${file.name.replace(
          ".docx",
          "_copy.docx"
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
