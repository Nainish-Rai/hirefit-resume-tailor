### **PRD: The 'Get-It-Done' Resume Tailor (MVP)**

- **Product:** An app that rewrites a user's DOCX resume to match a job description.
- **Vision:** Kill the soul-crushing task of manually tailoring a resume for every job application.
- **The Non-Negotiable MVP Goal:** A user can upload their `.docx` resume and a JD, and receive a tailored `.docx` file back that is _meaningfully better_ than what they started with.

---

### **Phase 1: The Backbone (Core I/O & Parsing)**

This phase is about proving we can handle the file itself. No AI, no fancy UI. We're just making sure the plumbing works.

- **Objective:** Ingest a `.docx` file, read its contents, and spit it back out without corrupting it.
- **User Story:** As a developer, I can send a `.docx` file to a server endpoint and get a valid `.docx` file back.
- **Key Tasks:**
  1.  Set up a barebones Next.js API route (`/api/tailor`).
  2.  Use `formidable` or `multer` to handle a file upload.
  3.  Install the `docx` library.
  4.  Write the logic to:
      - Read the uploaded file buffer into the `docx` library.
      - Iterate through all paragraphs and log their text to the console. This proves you can read it.
      - Use the library's packer to generate a new file buffer from the parsed document.
      - Send this buffer back to the client as a downloadable file.
- **Acceptance Criteria:** You can upload `my_resume.docx` and download `my_resume_copy.docx`, and the copy is a perfect, uncorrupted duplicate of the original.

---

### **Phase 2: The Brain (Targeted AI Integration)**

Now we bring in Gemini. We're not trying to tailor the whole document yet. We're proving we can tailor _one single piece_ of it successfully.

- **Objective:** Take one hardcoded sentence from an uploaded resume and get a rewritten version from Gemini.
- **User Story:** As a developer, I can see an AI-generated, improved version of a specific bullet point from my resume in the server logs.
- **Key Tasks:**
  1.  Modify the Phase 1 API route.
  2.  After parsing the `.docx`, grab the text of a specific paragraph (e.g., the 10th paragraph in the document).
  3.  Hardcode a sample Job Description string directly in your code.
  4.  Call the Gemini API with a highly specific prompt: `"Rewrite this resume bullet point: '[PASTE_BULLET_TEXT_HERE]' to align with this job description: '[PASTE_JD_HERE]'. Return only the rewritten text."`
  5.  Log Gemini's response to the console.
- **Acceptance Criteria:** When you run the process, your server console shows the original bullet point and a new, sensical, rewritten bullet point from Gemini.

---

### **Phase 3: The Stitch-Up (The First End-to-End Success)**

This is the "Frankenstein" phase. We're stitching the brain (Phase 2) into the backbone (Phase 1) to create a living, breathing... feature.

- **Objective:** Modify the uploaded `.docx` in-memory by replacing one paragraph with the AI-generated version.
- **User Story:** As a developer, I can upload a resume and download a new version where one bullet point has been magically improved.
- **Key Tasks:**
  1.  This is the big one. Combine the logic from the previous phases.
  2.  Instead of just logging the Gemini response, you need to find the original `Paragraph` object in your `docx` structure.
  3.  **This is critical:** You can't just "replace text." You must remove the old `TextRun`s from the paragraph and add a new `TextRun` containing the Gemini-generated text. This is how you preserve the original bullet point's formatting.
  4.  Pack the _modified_ document object into a new file buffer.
  5.  Send the new, modified `.docx` back to the user.
- **Acceptance Criteria:** You upload `resume_v1.docx`. You download `resume_v2.docx`. You open it and see a single, AI-rewritten bullet point in place of the old one, with formatting intact.

---

### **Phase 4: The Interface (Making It Real)**

Enough backend shenanigans. Let's build the simple, ugly interface that a real person can use.

- **Objective:** Create a frontend that allows a user to upload their files and trigger the entire backend process.
- **User Story:** As a user, I can visit a webpage, upload my resume, paste a job description, click a button, and get a tailored resume back.
- **Key Tasks:**
  1.  Build a simple Next.js page.
  2.  Add a file input (`<input type="file" accept=".docx">`).
  3.  Add a text area (`<textarea>`) for the Job Description.
  4.  Add a "Tailor My Resume" button.
  5.  On click, send both the file and the JD text to your API route.
  6.  **Upgrade the backend:** Remove the hardcoded text. Implement basic logic to identify which paragraphs to rewrite (e.g., any paragraph that starts with a bullet point character '•' under a heading that says "Experience").
  7.  Loop through these identified paragraphs, call Gemini for each one, and replace them in the `docx` object.
- **Acceptance Criteria:** The full user journey works. A real user can operate the tool and receive a fully tailored (not just one bullet point) resume. This is your functional MVP.

---

### **Phase 5: The Polish (Making It Not-Embarrassing)**

The MVP works, but it's fragile and the user experience is probably terrible. This phase is about basic usability and feedback.

- **Objective:** Add basic loading states, error handling, and a clear results page.
- **User Story:** As a user, I know what's happening after I click the button, I'm told if something goes wrong, and I can easily download my file.
- **Key Tasks:**
  1.  **Frontend:** Add a loading spinner that appears after the user clicks "submit." Disable the button to prevent double-submission.
  2.  **Backend:** Add `try...catch` blocks. If the uploaded file isn't a `.docx`, or if the Gemini API fails, send a proper error response (e.g., `400 Bad Request` or `500 Internal Server Error`).
  3.  **Frontend:** Handle the error responses. Show a simple, clear message like "Something went wrong. Please try again with a valid .docx file."
  4.  **Frontend:** On success, explicitly show a download link or automatically trigger the download, and then display a success message.
- **Acceptance Criteria:** The app no longer feels like a black box. It communicates its state (loading, success, error) to the user, making it ready for a small group of beta testers.
