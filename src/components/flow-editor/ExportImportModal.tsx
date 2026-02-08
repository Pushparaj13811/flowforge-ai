"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Copy, Upload, FileJson, Check, X } from "lucide-react";
import { useFlowStore } from "./store";
import { useCopyToClipboard } from "@/hooks";
import { cn } from "@/lib/utils";

interface ExportImportModalProps {
  open: boolean;
  onClose: () => void;
  workflowName?: string;
}

export function ExportImportModal({ open, onClose, workflowName = "workflow" }: ExportImportModalProps) {
  const { exportWorkflow, importWorkflow } = useFlowStore();
  const { copiedId, copyToClipboard } = useCopyToClipboard();
  const [mode, setMode] = React.useState<"export" | "import">("export");
  const [jsonText, setJsonText] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportWorkflow();
    setJsonText(json);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => copyToClipboard(jsonText, "export-json");

  const handleImport = () => {
    setImportError(null);
    const success = importWorkflow(jsonText);
    if (success) {
      onClose();
    } else {
      setImportError("Invalid workflow JSON. Please check the format.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
    };
    reader.readAsText(file);
  };

  React.useEffect(() => {
    if (open && mode === "export" && !jsonText) {
      handleExport();
    }
  }, [open, mode]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] bg-background border border-border rounded-lg shadow-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">Export / Import Workflow</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setMode("export")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  mode === "export"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Download className="h-4 w-4 inline-block mr-2" />
                Export
              </button>
              <button
                onClick={() => setMode("import")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  mode === "import"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4 inline-block mr-2" />
                Import
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {mode === "export" ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                    <FileJson className="h-4 w-4" />
                    Generate JSON
                  </Button>
                  {jsonText && (
                    <>
                      <Button onClick={handleDownload} size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download File
                      </Button>
                      <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                        {copiedId === "export-json" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy to Clipboard
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {jsonText && (
                  <textarea
                    value={jsonText}
                    readOnly
                    className="w-full h-[400px] p-3 text-xs font-mono border border-border rounded-lg bg-muted/50 resize-none"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste your workflow JSON here..."
                  className="w-full h-[400px] p-3 text-xs font-mono border border-border rounded-lg bg-background resize-none"
                />

                {importError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    {importError}
                  </div>
                )}

                <Button onClick={handleImport} disabled={!jsonText.trim()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Workflow
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

