interface JobDescriptionPanelProps {
  jobDescription: string;
}

export function JobDescriptionPanel({
  jobDescription,
}: JobDescriptionPanelProps) {
  return (
    <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Job Description
        </h2>
        <p className="text-sm text-slate-600">Reference for tailoring</p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono">
            {jobDescription}
          </pre>
        </div>
      </div>
    </div>
  );
}
