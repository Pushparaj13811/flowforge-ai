"use client";

import { motion } from "framer-motion";
import { User, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AuthRequired } from "../shared";

interface ProfileSectionProps {
  isSaving: boolean;
  onSave: () => void;
}

export function ProfileSection({ isSaving, onSave }: ProfileSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = React.useState(user?.name || "");
  const [email] = React.useState(user?.email || "");
  const [avatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Profile Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your personal information and how others see you
        </p>
      </div>

      {!isAuthenticated ? (
        <AuthRequired icon={User} message="Sign in to manage your profile settings" />
      ) : (
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white dark:bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div>
              <h3 className="font-medium">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                This is how you&apos;ll appear in workflow notifications
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <div className="relative">
                <Input
                  value={email}
                  disabled
                  className="h-11 pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import * as React from "react";
