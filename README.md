# HireFit - Resume Tailor

A Next.js application that uses AI to tailor resumes to job descriptions. Currently implementing Phase 2 of development.

## Phase 2 Status

✅ **Completed**: AI Integration with Gemini

- Extracts specific paragraph from uploaded .docx resume
- Calls Gemini API to rewrite bullet points
- Logs original and AI-improved text to console
- Hardcoded job description for testing

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Install dependencies:

```bash
npm install
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing Phase 2

1. Upload a `.docx` resume file using the web interface
2. Check the server console logs to see:
   - Original bullet point extracted from the 10th paragraph
   - AI-rewritten version optimized for the hardcoded job description
3. Download the file (unchanged in Phase 2 - modification happens in Phase 3)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI**: Google Gemini API via @google/genai SDK
- **File Processing**: JSZip for .docx parsing
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
