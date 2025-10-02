import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "../components/StatusBadge";
import type { Extraction } from "./types";

const MetadataTab = memo(function MetadataTab({
  extraction,
}: {
  extraction: Extraction;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Extraction Details</h4>
          <div className="rounded-lg border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">ID</TableCell>
                  <TableCell className="font-mono text-sm">
                    {extraction.id}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Created</TableCell>
                  <TableCell>
                    {new Date(extraction.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
                {extraction.updatedAt && (
                  <TableRow>
                    <TableCell className="font-medium">Updated</TableCell>
                    <TableCell>
                      {new Date(extraction.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <StatusBadge status={extraction.status} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {extraction.user && (
          <div>
            <h4 className="font-medium mb-3">User Information</h4>
            <div className="rounded-lg border">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-1/3">Name</TableCell>
                    <TableCell>{extraction.user.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email</TableCell>
                    <TableCell>{extraction.user.email}</TableCell>
                  </TableRow>
                  {extraction.user.role && (
                    <TableRow>
                      <TableCell className="font-medium">Role</TableCell>
                      <TableCell>{extraction.user.role}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {extraction.usage != null && (
          <div>
            <h4 className="font-medium mb-3">Usage Statistics</h4>
            <div className="rounded-lg border p-4">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(extraction.usage, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default MetadataTab;
