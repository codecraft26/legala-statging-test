"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ email?: string; workspace?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. Please check your invitation email.");
    }
  }, [token]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid invite token");
      setLoading(false);
      return;
    }

    try {
      const response = await Api.post<{ message: string }>("/user/accept-invite", { 
        token,
        password 
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-svh flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border p-8 shadow-sm space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Welcome to the team!</h1>
              <p className="text-muted-foreground">
                Your account has been created successfully. You can now log in with your new password.
              </p>
            </div>
          </div>
          
          <Button asChild className="w-full">
            <Link href="/login">
              Continue to login
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="min-h-svh flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border p-8 shadow-sm space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Invalid invite link</h1>
              <p className="text-muted-foreground">
                This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold">Accept invitation</h1>
          <p className="text-muted-foreground">
            Create your password to join the workspace.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full"
          >
            {loading ? "Creating account..." : "Accept invitation"}
          </Button>
        </form>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
