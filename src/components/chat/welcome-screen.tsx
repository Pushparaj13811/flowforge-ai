"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  MessageSquare,
  CreditCard,
  Database,
  Webhook,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

const suggestedPrompts = [
  {
    icon: Mail,
    title: "Email Notification",
    prompt: "Create a workflow that sends an email when a form is submitted",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: MessageSquare,
    title: "Slack Alert",
    prompt: "Send a Slack message to #sales when a new order comes in",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: CreditCard,
    title: "Payment Flow",
    prompt: "Create a payment processing workflow with Stripe",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Database,
    title: "Data Sync",
    prompt: "Sync form submissions to Google Sheets automatically",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Webhook,
    title: "Webhook Handler",
    prompt: "Handle incoming webhooks and route them based on type",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: GitBranch,
    title: "Conditional Logic",
    prompt: "If order amount is over $100, send VIP notification, otherwise regular confirmation",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="h-20 w-20 rounded-2xl bg-gradient-flow flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-3"
        >
          Welcome to FlowForge AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg max-w-md mx-auto"
        >
          Describe your automation workflow in natural language, and I&apos;ll build it for you.
        </motion.p>
      </motion.div>

      {/* Suggested Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-4xl"
      >
        <p className="text-sm text-muted-foreground text-center mb-4">
          Try one of these examples to get started:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestedPrompts.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPromptSelect(item.prompt)}
                className={cn(
                  "group text-left p-4 rounded-xl",
                  "glass border border-glass-border",
                  "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
                  "transition-all duration-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      item.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.prompt}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
