interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-3">
        Job Description
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the complete job description here. Include requirements, responsibilities, and preferred qualifications for best results..."
        rows={8}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-slate-900 placeholder-slate-500 text-sm leading-relaxed font-mono"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-slate-500">
          Minimum 50 characters required
        </span>
        <span className="text-xs text-slate-500">
          {value.length} characters
        </span>
      </div>
    </div>
  );
}
