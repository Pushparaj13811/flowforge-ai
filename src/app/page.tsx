"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Workflow,
  GitBranch,
  Play,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Check,
  ChevronRight,
  Trophy,
  Bot,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Natural Language",
    description: "Describe your workflow in plain English. No coding required.",
    color: "text-flow-blue",
    bgColor: "bg-flow-blue/10",
  },
  {
    icon: <Workflow className="h-6 w-6" />,
    title: "Visual Canvas",
    description: "See your workflows come to life with interactive visualizations.",
    color: "text-flow-purple",
    bgColor: "bg-flow-purple/10",
  },
  {
    icon: <Play className="h-6 w-6" />,
    title: "Live Execution",
    description: "Watch your workflows execute in real-time with detailed logs.",
    color: "text-flow-green",
    bgColor: "bg-flow-green/10",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analytics",
    description: "Track performance with beautiful dashboards and insights.",
    color: "text-flow-orange",
    bgColor: "bg-flow-orange/10",
  },
];

const examplePrompts = [
  "Create a workflow that sends a Slack message when a form is submitted",
  "Build an email sequence for new customer onboarding",
  "Set up an alert when website traffic drops below threshold",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-flow flex items-center justify-center">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-flow opacity-30 blur-sm -z-10" />
          </div>
          <span className="font-bold text-xl">FlowForge AI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/app/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Templates
          </Link>
          <Link href="/app">
            <Button variant="gradient" size="sm">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="purple" className="mb-6">
              Powered by Tambo Generative UI
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Build Workflows with
            <span className="text-gradient-flow block">Natural Language</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Stop learning complex tools. Start describing outcomes.
            FlowForge AI turns your words into powerful automation workflows.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/app">
              <Button variant="gradient" size="xl" className="gap-2">
                Start Building Free
              </Button>
            </Link>
            <Link href="/app/templates">
              <Button variant="outline" size="xl" className="gap-2">
                <Layers className="h-5 w-5" />
                View Templates
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-flow-green" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-flow-green" />
              Free tier available
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-flow-orange" />
              Hackathon Project
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          className="max-w-5xl mx-auto mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-flow rounded-3xl opacity-20 blur-3xl" />

            {/* Main Card */}
            <Card variant="glass" className="relative overflow-hidden">
              <CardContent className="p-0">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-flow-orange" />
                    <div className="h-3 w-3 rounded-full bg-flow-green" />
                  </div>
                  <span className="text-sm text-muted-foreground">FlowForge AI</span>
                  <div className="w-16" />
                </div>

                {/* Chat Content */}
                <div className="p-6 space-y-6 min-h-[300px]">
                  {/* User Message */}
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md max-w-md">
                      Create a workflow that sends a Slack notification when a high-value lead submits a form
                    </div>
                  </motion.div>

                  {/* AI Response */}
                  <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-flow flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-3">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-md">
                        I&apos;ll create that workflow for you. Here&apos;s what it looks like:
                      </div>

                      {/* Mini Workflow Preview */}
                      <motion.div
                        className="bg-card border border-border rounded-xl p-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.6 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-flow-blue/10 flex items-center justify-center">
                              <Workflow className="h-5 w-5 text-flow-blue" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Form Submit</p>
                              <p className="text-xs text-muted-foreground">Trigger</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-flow-purple/10 flex items-center justify-center">
                              <GitBranch className="h-5 w-5 text-flow-purple" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Check Value</p>
                              <p className="text-xs text-muted-foreground">Condition</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-lg bg-flow-green/10 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-flow-green" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Slack Alert</p>
                              <p className="text-xs text-muted-foreground">Action</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="info" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to automate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              FlowForge AI combines the power of natural language processing with
              beautiful visual workflows.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <span className={feature.color}>{feature.icon}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Prompts Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="gradient" className="mb-4">Try it out</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Just describe what you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Here are some examples to get you started
            </p>
          </motion.div>

          <div className="space-y-4">
            {examplePrompts.map((prompt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href="/app">
                  <Card hover className="group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-flow flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm md:text-base">&quot;{prompt}&quot;</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-flow rounded-3xl opacity-10 blur-3xl" />
            <Card variant="gradient" className="relative overflow-hidden">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Ready to build your first workflow?
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Start automating your work with natural language.
                  No complex tools to learn.
                </p>
                <Link href="/app">
                  <Button variant="glass" size="xl" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-flow flex items-center justify-center">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">FlowForge AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Tambo for &quot;The UI Strikes Back&quot; Hackathon
          </p>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Try App
            </Link>
            <a
              href="https://docs.tambo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tambo Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
