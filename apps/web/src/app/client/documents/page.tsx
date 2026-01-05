"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  File,
  FileImage,
  FileSpreadsheet,
  Eye,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@cjdquick/ui";

interface Document {
  id: string;
  orderId: string | null;
  awbNumber: string | null;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  rejectionReason: string | null;
  uploadedBy: string;
  verifiedAt: string | null;
  createdAt: string;
}

async function fetchDocuments(type?: string, page?: number) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (page) params.set("page", page.toString());
  const res = await fetch(`/api/client/documents?${params.toString()}`);
  return res.json();
}

const DOCUMENT_TYPES = [
  { key: "", label: "All Documents" },
  { key: "INVOICE", label: "Invoices" },
  { key: "EWAY_BILL", label: "E-Way Bills" },
  { key: "PACKING_LIST", label: "Packing Lists" },
  { key: "POD", label: "POD" },
  { key: "CUSTOMS", label: "Customs" },
  { key: "OTHER", label: "Other" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  UPLOADED: { label: "Uploaded", color: "info", icon: Clock },
  VERIFIED: { label: "Verified", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "danger", icon: AlertTriangle },
};

const TYPE_ICONS: Record<string, any> = {
  INVOICE: FileText,
  EWAY_BILL: FileSpreadsheet,
  POD: FileImage,
  PACKING_LIST: File,
  CUSTOMS: FileText,
  OTHER: File,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["client-documents", typeFilter, page],
    queryFn: () => fetchDocuments(typeFilter, page),
  });

  const documents: Document[] = data?.data?.items || [];
  const typeCounts: Record<string, number> = data?.data?.typeCounts || {};
  const pagination = data?.data?.pagination || { total: 0 };

  const totalDocuments = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">View and manage your shipping documents</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {DOCUMENT_TYPES.slice(1).map((type) => {
          const TypeIcon = TYPE_ICONS[type.key] || File;
          const count = typeCounts[type.key] || 0;
          return (
            <button
              key={type.key}
              type="button"
              className={`p-4 cursor-pointer transition-all rounded-lg border text-left ${
                typeFilter === type.key
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => {
                setTypeFilter(typeFilter === type.key ? "" : type.key);
                setPage(1);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TypeIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{type.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {typeFilter
              ? DOCUMENT_TYPES.find((t) => t.key === typeFilter)?.label
              : "All Documents"}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({pagination.total} documents)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No documents found</p>
              <p className="text-sm text-gray-400 mt-2">
                Documents will appear here when generated for your shipments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Related To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.map((doc) => {
                    const statusConfig = STATUS_CONFIG[doc.status];
                    const TypeIcon = TYPE_ICONS[doc.documentType] || File;
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <TypeIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-xs">
                                {doc.documentName}
                              </p>
                              <p className="text-xs text-gray-500">{doc.mimeType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default" size="sm">
                            {doc.documentType.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {doc.awbNumber ? (
                            <span className="font-medium">{doc.awbNumber}</span>
                          ) : doc.orderId ? (
                            <span className="text-gray-500">Order #{doc.orderId}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusConfig?.color as any || "default"}
                            size="sm"
                          >
                            {statusConfig?.label || doc.status}
                          </Badge>
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1">
                              {doc.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={doc.fileUrl} download>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 20 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= pagination.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
