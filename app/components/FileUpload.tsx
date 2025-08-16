interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileUpload({ file, onFileChange }: FileUploadProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-3">
        Resume (DOCX)
      </label>
      <div className="relative">
        <input
          type="file"
          accept=".docx"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className={`${
            file
              ? "border-green-300 bg-green-50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50"
          } border-2 border-dashed rounded-lg p-6 text-center transition-colors`}
        >
          {file ? (
            <div className="flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green-600 mr-2"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-green-700">
                {file.name}
              </span>
            </div>
          ) : (
            <div>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-slate-400 mx-auto mb-3"
              >
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5 5 5m-5-5v12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-medium">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-xs text-slate-500">
                DOCX files only, up to 5MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
