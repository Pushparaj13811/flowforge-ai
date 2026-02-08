"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useFlowStore } from "./store";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { nodes, selectNode } = useFlowStore();
  const { fitView } = useReactFlow();
  const [query, setQuery] = React.useState("");

  const filteredNodes = React.useMemo(() => {
    if (!query.trim()) return nodes;
    const lower = query.toLowerCase();
    return nodes.filter(
      (n) =>
        n.data.label.toLowerCase().includes(lower) ||
        n.data.description?.toLowerCase().includes(lower) ||
        n.data.nodeType.toLowerCase().includes(lower)
    );
  }, [nodes, query]);

  const handleSelect = (nodeId: string) => {
    selectNode(nodeId);
    // Fit view to selected node
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      fitView({ nodes: [node], duration: 300, padding: 0.3 });
    }
    onClose();
  };

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Handled by parent component
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

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
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-md bg-background border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes..."
              autoFocus
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button onClick={onClose} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredNodes.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {query ? "No nodes found" : "Type to search..."}
              </div>
            ) : (
              <div className="py-2">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{node.data.label}</div>
                      {node.data.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {node.data.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {node.data.nodeType}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-background border">Esc</kbd> to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
