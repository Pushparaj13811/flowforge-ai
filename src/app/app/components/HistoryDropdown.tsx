"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/lib/conversation/types";

interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  lastWeek: Conversation[];
  older: Conversation[];
}

interface HistoryDropdownProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  groupedConversations: GroupedConversations;
  onToggle: () => void;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

const PERIOD_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  lastWeek: "Last 7 days",
  older: "Older",
} as const;

export function HistoryDropdown({
  conversations,
  activeConversationId,
  isOpen,
  isLoading,
  groupedConversations,
  onToggle,
  onClose,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: HistoryDropdownProps) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 min-w-[200px] justify-between"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            <span className="text-sm">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title || "Untitled"
                : "Select conversation"}
            </span>
          </div>
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
          />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-80 max-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-background shadow-xl z-[100]"
            >
              {/* Header */}
              <div className="p-3 border-b border-border/50">
                <Button onClick={onNewConversation} className="w-full h-8 gap-1.5" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  New Chat
                </Button>
              </div>

              {/* Conversation List */}
              <div className="overflow-y-auto max-h-[400px] p-2">
                {isLoading ? (
                  <LoadingState />
                ) : conversations.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ConversationList
                    groupedConversations={groupedConversations}
                    activeConversationId={activeConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">No conversations yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Start a new chat to build workflows
      </p>
    </div>
  );
}

interface ConversationListProps {
  groupedConversations: GroupedConversations;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationList({
  groupedConversations,
  activeConversationId,
  onSelect,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="space-y-3">
      {(Object.entries(groupedConversations) as [keyof GroupedConversations, Conversation[]][]).map(
        ([period, convs]) => {
          if (convs.length === 0) return null;

          return (
            <div key={period}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                {PERIOD_LABELS[period]}
              </h4>
              <div className="space-y-1">
                {convs.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  return (
    <div
      className={cn(
        "group relative rounded-lg p-2 cursor-pointer transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "hover:bg-muted/50 text-muted-foreground"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {conversation.title || "Untitled conversation"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
          </p>
        </div>

        {!isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
