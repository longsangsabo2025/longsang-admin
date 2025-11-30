/**
 * Bulk Operations Component
 * Handles bulk import, export, delete, and update operations
 */

import { useBulkDelete, useBulkIngest, useBulkUpdate, useExportDomain } from "@/brain/hooks/useBulkOperations";
import { useDomains } from "@/brain/hooks/useDomains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Trash2, Edit, Loader2 } from "lucide-react";
import { useState } from "react";

interface BulkOperationsProps {
  readonly domainId?: string | null;
}

export function BulkOperations({ domainId }: BulkOperationsProps) {
  const { data: domains } = useDomains();
  const bulkIngest = useBulkIngest();
  const bulkDelete = useBulkDelete();
  const bulkUpdate = useBulkUpdate();
  const exportDomain = useExportDomain();

  // Bulk Ingest State
  const [ingestData, setIngestData] = useState("");
  const [selectedDomainForIngest, setSelectedDomainForIngest] = useState(domainId || "");

  // Bulk Delete State
  const [deleteIds, setDeleteIds] = useState("");

  // Bulk Update State
  const [updateData, setUpdateData] = useState("");

  // Export State
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [selectedDomainForExport, setSelectedDomainForExport] = useState(domainId || "");

  const handleBulkIngest = async () => {
    try {
      const knowledge = JSON.parse(ingestData);
      if (!Array.isArray(knowledge)) {
        throw new TypeError("Data must be an array of knowledge items");
      }

      if (!selectedDomainForIngest) {
        throw new Error("Please select a domain");
      }

      await bulkIngest.mutateAsync({
        knowledge: knowledge.map((k) => ({
          ...k,
          domainId: selectedDomainForIngest,
        })),
      });

      setIngestData("");
    } catch (error) {
      console.error("Bulk ingest error:", error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const ids = deleteIds
        .split("\n")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (ids.length === 0) {
        throw new Error("Please enter at least one ID");
      }

      await bulkDelete.mutateAsync(ids);
      setDeleteIds("");
    } catch (error) {
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const updates = JSON.parse(updateData);
      if (!Array.isArray(updates)) {
        throw new TypeError("Data must be an array of update objects");
      }

      await bulkUpdate.mutateAsync({ updates });
      setUpdateData("");
    } catch (error) {
      console.error("Bulk update error:", error);
    }
  };

  const handleExport = async () => {
    if (!selectedDomainForExport) {
      alert("Please select a domain to export");
      return;
    }

    try {
      const data = await exportDomain.mutateAsync({
        domainId: selectedDomainForExport,
        format: exportFormat,
      });

      if (exportFormat === "csv") {
        // Download CSV
        const blob = new Blob([data as string], { type: "text/csv" });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `domain-${selectedDomainForExport}.csv`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `domain-${selectedDomainForExport}.json`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    file.text().then((content) => {
      setIngestData(content);
    }).catch((error) => {
      console.error("Error reading file:", error);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bulk Operations</h2>
        <p className="text-muted-foreground">Import, export, and manage knowledge in bulk</p>
      </div>

      <Tabs defaultValue="ingest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ingest">Bulk Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="delete">Bulk Delete</TabsTrigger>
          <TabsTrigger value="update">Bulk Update</TabsTrigger>
        </TabsList>

        {/* Bulk Import */}
        <TabsContent value="ingest">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Knowledge</CardTitle>
              <CardDescription>
                Import multiple knowledge items at once. Format: JSON array of knowledge objects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domain-ingest">Domain</Label>
                <Select value={selectedDomainForIngest} onValueChange={setSelectedDomainForIngest}>
                  <SelectTrigger id="domain-ingest">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains?.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ingest-data">JSON Data</Label>
                <Textarea
                  id="ingest-data"
                  value={ingestData}
                  onChange={(e) => setIngestData(e.target.value)}
                  placeholder='[{"title": "Title 1", "content": "Content 1", "tags": ["tag1"]}, ...]'
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Each item should have: title, content, contentType (optional), tags (optional), metadata (optional)
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" asChild>
                  <Button variant="outline" type="button" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload JSON File
                    </span>
                  </Button>
                </Label>
                <Button
                  onClick={handleBulkIngest}
                  disabled={!ingestData || !selectedDomainForIngest || bulkIngest.isPending}
                >
                  {bulkIngest.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Knowledge
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Domain</CardTitle>
              <CardDescription>Export domain data in JSON or CSV format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domain-export">Domain</Label>
                <Select value={selectedDomainForExport} onValueChange={setSelectedDomainForExport}>
                  <SelectTrigger id="domain-export">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains?.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-format">Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "json" | "csv")}>
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExport}
                disabled={!selectedDomainForExport || exportDomain.isPending}
              >
                {exportDomain.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Domain
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Delete */}
        <TabsContent value="delete">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Delete Knowledge</CardTitle>
              <CardDescription>Delete multiple knowledge items by their IDs (one per line)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="delete-ids">Knowledge IDs</Label>
                <Textarea
                  id="delete-ids"
                  value={deleteIds}
                  onChange={(e) => setDeleteIds(e.target.value)}
                  placeholder="Enter one ID per line"
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>

              <Button
                onClick={handleBulkDelete}
                disabled={!deleteIds || bulkDelete.isPending}
                variant="destructive"
              >
                {bulkDelete.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Update */}
        <TabsContent value="update">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Update Knowledge</CardTitle>
              <CardDescription>
                Update multiple knowledge items. Format: JSON array of update objects with id and fields to update.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="update-data">JSON Data</Label>
                <Textarea
                  id="update-data"
                  value={updateData}
                  onChange={(e) => setUpdateData(e.target.value)}
                  placeholder='[{"id": "uuid", "title": "New Title", "tags": ["new-tag"]}, ...]'
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Each object must have an "id" field and any fields to update (title, content, tags, metadata)
                </p>
              </div>

              <Button
                onClick={handleBulkUpdate}
                disabled={!updateData || bulkUpdate.isPending}
              >
                {bulkUpdate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Knowledge
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

