"use client";

import { Header } from "./components/Header";
import { UploadForm } from "./components/UploadForm";
import { ProcessingState } from "./components/ProcessingState";
import { SuccessState } from "./components/SuccessState";
import { JobDescriptionPanel } from "./components/JobDescriptionPanel";
import { ResumeEditorPanel } from "./components/ResumeEditorPanel";
import { SidebarPanel } from "./components/SidebarPanel";
import { useResumeProcessor } from "./hooks/useResumeProcessor";
import { useWorkbenchManager } from "./hooks/useWorkbenchManager";

export default function Home() {
  const {
    file,
    setFile,
    jobDescription,
    setJobDescription,
    status,
    workbench,
    setWorkbench,
    isProcessing,
    canSubmit,
    resetStatus,
    resetAll,
    handlePreview,
    handleFinalize,
    handleOneClickTailor,
  } = useResumeProcessor();

  const {
    updateChoice,
    updateCustomText,
    acceptAll,
    useOriginals,
    matchScore,
    acceptedCount,
    customCount,
    originalCount,
  } = useWorkbenchManager(workbench, setWorkbench);

  const isUploadState =
    !workbench && (status.state === "idle" || status.state === "error");
  const isWorkbenchState =
    workbench &&
    status.state !== "processing" &&
    status.state !== "uploading" &&
    status.state !== "success";

  return (
    <div className="h-full min-h-screen bg-slate-50">
      <Header
        hasSuccessStatus={status.state === "success"}
        onStartOver={resetAll}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Upload State */}
        {isUploadState && (
          <UploadForm
            file={file}
            jobDescription={jobDescription}
            status={status}
            canSubmit={canSubmit}
            onFileChange={setFile}
            onJobDescriptionChange={setJobDescription}
            onPreview={handlePreview}
            onOneClickTailor={handleOneClickTailor}
            onResetStatus={resetStatus}
          />
        )}

        {/* Processing State */}
        {isProcessing && <ProcessingState status={status} />}

        {/* Success State */}
        {status.state === "success" && (
          <SuccessState status={status} onStartOver={resetAll} />
        )}

        {/* Workbench State */}
        {isWorkbenchState && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
            <JobDescriptionPanel jobDescription={jobDescription} />
            <ResumeEditorPanel
              workbench={workbench}
              onUpdateChoice={updateChoice}
              onUpdateCustomText={updateCustomText}
              onAcceptAll={acceptAll}
              onUseOriginals={useOriginals}
            />
            <SidebarPanel
              matchScore={matchScore}
              acceptedCount={acceptedCount}
              customCount={customCount}
              originalCount={originalCount}
              onFinalize={handleFinalize}
              onBackToUpload={() => setWorkbench(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
