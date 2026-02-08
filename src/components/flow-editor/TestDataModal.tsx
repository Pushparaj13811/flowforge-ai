/**
 * @file TestDataModal.tsx
 * @description Modal for entering test data before executing workflow
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestDataModalProps {
  open: boolean;
  onClose: () => void;
  onExecute: (testData: Record<string, unknown>) => void;
}

export function TestDataModal({ open, onClose, onExecute }: TestDataModalProps) {
  const [testData, setTestData] = React.useState("{\n  \"email\": \"test@example.com\",\n  \"name\": \"John Doe\",\n  \"userId\": \"12345\"\n}");
  const [error, setError] = React.useState<string | null>(null);

  const handleExecute = () => {
    setError(null);

    // Validate JSON
    try {
      const parsed: unknown = JSON.parse(testData);

      // Ensure it's an object
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError("Test data must be a JSON object, not an array or primitive value.");
        return;
      }

      onExecute(parsed as Record<string, unknown>);
      onClose();
    } catch (err) {
      setError("Invalid JSON format. Please fix the syntax and try again.");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white dark:bg-card rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Test Workflow</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter sample trigger data to test your workflow. This data will be available
                as <code className="font-mono bg-muted px-1 rounded text-xs">$trigger.*</code> variables
                in your nodes.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Test Data (JSON)
              </label>
              <textarea
                value={testData}
                onChange={(e) => {
                  setTestData(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 font-mono text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none resize-none min-h-[200px]"
                placeholder='{\n  "email": "test@example.com",\n  "name": "John Doe"\n}'
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="p-3 bg-muted/50 rounded-md text-sm">
              <p className="font-medium mb-1">Example usage in nodes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <code className="font-mono">&#123;&#123;$trigger.email&#125;&#125;</code> → test@example.com
                </li>
                <li>
                  <code className="font-mono">&#123;&#123;$trigger.name&#125;&#125;</code> → John Doe
                </li>
                <li>
                  <code className="font-mono">&#123;&#123;$trigger.userId&#125;&#125;</code> → 12345
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleExecute}>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
