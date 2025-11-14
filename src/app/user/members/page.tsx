"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembers, useUpdateUserRole, useRemoveMember } from "@/hooks/use-user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Loader2, AlertTriangle } from "lucide-react";

export default function MembersPage() {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    memberId: string | null;
    newRole: "Admin" | "Member" | null;
  }>({ open: false, memberId: null, newRole: null });
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    memberId: string | null;
  }>({ open: false, memberId: null });
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: members = [], isLoading: loading, error } = useMembers();
  const updateRoleMutation = useUpdateUserRole();
  const removeMemberMutation = useRemoveMember();

  const getDisplayRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      default:
        return role || "Member";
    }
  };

  const handleRoleChange = (memberId: string, newRole: "Admin" | "Member") => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const currentRole = getDisplayRole(member.role);
    if (currentRole === newRole) return;

    setRoleChangeDialog({ open: true, memberId, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeDialog.memberId || !roleChangeDialog.newRole) return;

    setUpdatingRoleId(roleChangeDialog.memberId);
    setRoleChangeDialog({ open: false, memberId: null, newRole: null });
    
    try {
      await updateRoleMutation.mutateAsync({
        userId: roleChangeDialog.memberId,
        role: roleChangeDialog.newRole,
      });
      showToast(`Role updated to ${roleChangeDialog.newRole}`, "success");
    } catch (err: any) {
      showToast(
        err?.message || "Failed to update role",
        "error"
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveClick = (memberId: string) => {
    setRemoveDialog({ open: true, memberId });
  };

  const confirmRemoveMember = async () => {
    if (!removeDialog.memberId) return;

    const memberId = removeDialog.memberId;
    setRemoveDialog({ open: false, memberId: null });
    setRemovingId(memberId);
    
    try {
      await removeMemberMutation.mutateAsync(memberId);
      showToast("Member removed successfully", "success");
    } catch (err: any) {
      showToast(
        err?.message || "Failed to remove member",
        "error"
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Team Members</h1>
      {loading ? <p className="text-muted-foreground">Loading...</p> : null}
      {error ? (
        <p className="text-red-600 text-sm">
          {error instanceof Error ? error.message : "Failed to load members"}
        </p>
      ) : null}
      {!loading && !error ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                {user?.role === "Owner" ? (
                  <th className="px-4 py-3 text-left">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const currentRole = getDisplayRole(m.role);
                const isOwner = currentRole === "Owner";
                const isUpdating = updatingRoleId === m.id;
                
                return (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-3">{m.name ?? "—"}</td>
                    <td className="px-4 py-3">{m.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {user?.role === "Owner" && !isOwner ? (
                        <Select
                          value={currentRole}
                          onValueChange={(value) => 
                            handleRoleChange(m.id, value as "Admin" | "Member")
                          }
                          disabled={isUpdating || removingId === m.id}
                        >
                          <SelectTrigger className="w-32 h-8">
                            {isUpdating ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{currentRole}</span>
                      )}
                    </td>
                    {user?.role === "Owner" ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!isOwner && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs hover:bg-red-50 text-red-600 dark:hover:bg-red-950/20"
                              onClick={() => handleRemoveClick(m.id)}
                              disabled={removingId === m.id || isUpdating}
                            >
                              {removingId === m.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
              {members.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6"
                    colSpan={user?.role === "Owner" ? 4 : 3}
                  >
                    <p className="text-muted-foreground">No members found.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Role Change Confirmation Dialog */}
      <Dialog open={roleChangeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRoleChangeDialog({ open: false, memberId: null, newRole: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle>Change Member Role</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {(() => {
                const member = members.find((m) => m.id === roleChangeDialog.memberId);
                const currentRole = member ? getDisplayRole(member.role) : "";
                return member
                  ? `Are you sure you want to change ${member.name || member.email}'s role from ${currentRole} to ${roleChangeDialog.newRole}?`
                  : "";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleChangeDialog({ open: false, memberId: null, newRole: null })}
              disabled={updatingRoleId === roleChangeDialog.memberId}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={updatingRoleId === roleChangeDialog.memberId}
            >
              {updatingRoleId === roleChangeDialog.memberId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRemoveDialog({ open: false, memberId: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle>Remove Member</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {(() => {
                const member = members.find((m) => m.id === removeDialog.memberId);
                return member
                  ? `Are you sure you want to remove ${member.name || member.email}? This action cannot be undone.`
                  : "";
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog({ open: false, memberId: null })}
              disabled={removingId === removeDialog.memberId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={removingId === removeDialog.memberId}
            >
              {removingId === removeDialog.memberId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
