"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAcceptInvite } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import PasswordField from "../components/PasswordField";
import { validateInvitePassword } from "../utils";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const acceptMutation = useAcceptInvite();
  const [inviteInfo, setInviteInfo] = useState<{
    email?: string;
    workspace?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. Please check your invitation email.");
    }
  }, [token]);

  // using shared validator in ../utils

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const passwordError = validateInvitePassword(password);
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
      await acceptMutation.mutateAsync({ token, password });
      setSuccess(true);
    } catch (err: any) {
      // Enhanced error handling for different types of API errors
      let errorMessage = "Failed to accept invite";

      if (err?.message) {
        // Check if it's a structured error response
        try {
          const errorData = JSON.parse(err.message);

          // Handle different error response formats
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            // Handle Zod validation errors
            if (errorData.error.name === "ZodError" && errorData.error.issues) {
              const firstIssue = errorData.error.issues[0];
              if (
                firstIssue.path.includes("token") &&
                firstIssue.validation === "uuid"
              ) {
                errorMessage =
                  "Invalid invitation token format. Please check your invitation link.";
              } else {
                errorMessage =
                  firstIssue.message || "Validation error occurred.";
              }
            } else {
              errorMessage = errorData.error;
            }
          }
        } catch {
          // If not JSON, use the message as is
          errorMessage = err.message;
        }
      }

      // Handle specific error cases with more comprehensive matching
      if (
        errorMessage.includes("Invalid invite token") ||
        errorMessage.includes("Invalid token") ||
        errorMessage.includes("Invalid invitation token format")
      ) {
        errorMessage =
          "This invitation link is invalid or has expired. Please contact your administrator for a new invitation.";
      } else if (
        errorMessage.includes("Unique constraint failed") ||
        errorMessage.includes("email") ||
        errorMessage.includes("already exists")
      ) {
        errorMessage =
          "An account with this email already exists. Please try logging in instead.";
      } else if (
        errorMessage.includes("400") ||
        errorMessage.includes("Bad Request") ||
        errorMessage.includes("Validation error")
      ) {
        errorMessage =
          "Invalid request. Please check your information and try again.";
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("Internal Server Error") ||
        errorMessage.includes("PrismaClientKnownRequestError")
      ) {
        errorMessage =
          "Server error occurred. Please try again later or contact support.";
      } else if (errorMessage.includes("Invalid uuid")) {
        errorMessage =
          "Invalid invitation link format. Please check your invitation email.";
      }

      setError(errorMessage);
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
                Your account has been created successfully. You can now log in
                with your new password.
              </p>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href="/login">Continue to login</Link>
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
                This invitation link is invalid or has expired. Please contact
                your administrator for a new invitation.
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
          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            disabled={loading}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            disabled={loading}
          />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          {error && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>

              {/* Show appropriate action buttons based on error type */}
              {error.includes("account with this email already exists") && (
                <div className="flex space-x-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href="/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="flex-1">
                    <Link href="/forgot-password">Reset Password</Link>
                  </Button>
                </div>
              )}

              {error.includes("invalid or has expired") && (
                <div className="text-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Back to Login</Link>
                  </Button>
                </div>
              )}

              {error.includes("Server error") && (
                <div className="text-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              )}
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
