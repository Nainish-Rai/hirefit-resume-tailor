import type { ProcessingStatus } from "../types";

interface ProcessingStateProps {
  status: ProcessingStatus;
}

const statusMessages = {
  uploading: {
    title: "Uploading Resume",
    steps: [
      "Uploading your resume...",
      "Validating file format...",
      "Preparing for analysis...",
    ],
  },
  processing: {
    title: "AI Analysis in Progress",
    steps: [
      "Analyzing your experience...",
      "Understanding job requirements...",
      "Rewriting bullet points...",
      "Optimizing for keywords...",
      "Final polish and review...",
      "Almost done!",
    ],
  },
};

export function ProcessingState({ status }: ProcessingStateProps) {
  const currentStatus =
    status.state === "uploading" ? "uploading" : "processing";
  const { title, steps } = statusMessages[currentStatus];

  // Simulate progression through steps
  const progressPercentage = status.state === "uploading" ? 25 : 75;
  const currentStepIndex = Math.floor(
    (progressPercentage / 100) * steps.length
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full mx-auto"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

          {/* Pulsing dots around the spinner */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>

        {/* Current Status Message */}
        <div className="mb-6">
          <p className="text-blue-600 font-medium mb-1">
            {steps[Math.min(currentStepIndex, steps.length - 1)]}
          </p>
          <p className="text-sm text-slate-500">{status.message}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index <= currentStepIndex
                  ? "bg-blue-600"
                  : index === currentStepIndex + 1
                  ? "bg-blue-300 animate-pulse"
                  : "bg-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Estimated Time */}
        <div className="text-xs text-slate-500">
          {status.state === "uploading"
            ? "Usually takes 10-15 seconds"
            : "This typically takes 30-60 seconds"}
        </div>
      </div>
    </div>
  );
}
