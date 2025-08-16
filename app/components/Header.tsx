interface HeaderProps {
  hasSuccessStatus: boolean;
  onStartOver: () => void;
}

export function Header({ hasSuccessStatus, onStartOver }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">HireFit</h1>
            <p className="text-sm text-slate-600">Resume Tailor</p>
          </div>
        </div>

        {hasSuccessStatus && (
          <button
            onClick={onStartOver}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Start New Project
          </button>
        )}
      </div>
    </header>
  );
}
