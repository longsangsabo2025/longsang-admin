/**
 * Core Logic Comparison Component
 * Compare two versions side-by-side
 */

import { useCompareVersions, useCoreLogicVersions } from "@/brain/hooks/useCoreLogic";
import type { CoreLogicComparison } from "@/brain/types/core-logic.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Loader2, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface CoreLogicComparisonProps {
  domainId: string;
}

export function CoreLogicComparison({ domainId }: CoreLogicComparisonProps) {
  const { data: versions } = useCoreLogicVersions(domainId);
  const compareMutation = useCompareVersions();
  const [version1Id, setVersion1Id] = useState<string>("");
  const [version2Id, setVersion2Id] = useState<string>("");
  const [comparison, setComparison] = useState<CoreLogicComparison | null>(null);

  const handleCompare = async () => {
    if (!version1Id || !version2Id) {
      return;
    }

    try {
      const result = await compareMutation.mutateAsync({
        version1Id,
        version2Id,
      });
      setComparison(result);
    } catch (error) {
      console.error("Comparison error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Version Comparison</h2>
        <p className="text-muted-foreground">Compare two core logic versions to see changes</p>
      </div>

      {/* Version Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Select Versions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Version 1</label>
              <Select value={version1Id} onValueChange={setVersion1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version 1" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version} {v.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Version 2</label>
              <Select value={version2Id} onValueChange={setVersion2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version 2" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Version {v.version} {v.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={!version1Id || !version2Id || compareMutation.isPending || version1Id === version2Id}
            className="w-full"
          >
            {compareMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Versions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Version Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Version {comparison.version1.version}</CardTitle>
                <CardDescription>
                  {new Date(comparison.version1.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparison.version1.changeSummary && (
                  <p className="text-sm text-muted-foreground">{comparison.version1.changeSummary}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version {comparison.version2.version}</CardTitle>
                <CardDescription>
                  {new Date(comparison.version2.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparison.version2.changeSummary && (
                  <p className="text-sm text-muted-foreground">{comparison.version2.changeSummary}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Differences */}
          <Card>
            <CardHeader>
              <CardTitle>Differences</CardTitle>
              <CardDescription>Changes between versions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* First Principles */}
              <div>
                <h3 className="font-semibold mb-3">First Principles</h3>
                {comparison.differences.firstPrinciples.added.length > 0 && (
                  <div className="mb-3">
                    <Badge variant="default" className="mb-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Added ({comparison.differences.firstPrinciples.added.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.firstPrinciples.added.map((item, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.firstPrinciples.removed.length > 0 && (
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      <Minus className="h-3 w-3 mr-1" />
                      Removed ({comparison.differences.firstPrinciples.removed.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.firstPrinciples.removed.map((item, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.firstPrinciples.added.length === 0 &&
                  comparison.differences.firstPrinciples.removed.length === 0 && (
                    <p className="text-sm text-muted-foreground">No changes</p>
                  )}
              </div>

              {/* Mental Models */}
              <div>
                <h3 className="font-semibold mb-3">Mental Models</h3>
                {comparison.differences.mentalModels.added.length > 0 && (
                  <div className="mb-3">
                    <Badge variant="default" className="mb-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Added ({comparison.differences.mentalModels.added.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.mentalModels.added.map((item, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.mentalModels.removed.length > 0 && (
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      <Minus className="h-3 w-3 mr-1" />
                      Removed ({comparison.differences.mentalModels.removed.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.mentalModels.removed.map((item, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.mentalModels.added.length === 0 &&
                  comparison.differences.mentalModels.removed.length === 0 && (
                    <p className="text-sm text-muted-foreground">No changes</p>
                  )}
              </div>

              {/* Decision Rules */}
              <div>
                <h3 className="font-semibold mb-3">Decision Rules</h3>
                {comparison.differences.decisionRules.added.length > 0 && (
                  <div className="mb-3">
                    <Badge variant="default" className="mb-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Added ({comparison.differences.decisionRules.added.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.decisionRules.added.map((item, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <p className="text-sm">
                            <span className="font-medium">If:</span> {item.condition}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Then:</span> {item.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.decisionRules.removed.length > 0 && (
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      <Minus className="h-3 w-3 mr-1" />
                      Removed ({comparison.differences.decisionRules.removed.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.decisionRules.removed.map((item, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-sm">
                            <span className="font-medium">If:</span> {item.condition}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Then:</span> {item.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.decisionRules.added.length === 0 &&
                  comparison.differences.decisionRules.removed.length === 0 && (
                    <p className="text-sm text-muted-foreground">No changes</p>
                  )}
              </div>

              {/* Anti-patterns */}
              <div>
                <h3 className="font-semibold mb-3">Anti-patterns</h3>
                {comparison.differences.antiPatterns.added.length > 0 && (
                  <div className="mb-3">
                    <Badge variant="default" className="mb-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Added ({comparison.differences.antiPatterns.added.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.antiPatterns.added.map((item, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.antiPatterns.removed.length > 0 && (
                  <div>
                    <Badge variant="destructive" className="mb-2">
                      <Minus className="h-3 w-3 mr-1" />
                      Removed ({comparison.differences.antiPatterns.removed.length})
                    </Badge>
                    <div className="space-y-2 mt-2">
                      {comparison.differences.antiPatterns.removed.map((item, idx) => (
                        <div key={idx} className="p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {comparison.differences.antiPatterns.added.length === 0 &&
                  comparison.differences.antiPatterns.removed.length === 0 && (
                    <p className="text-sm text-muted-foreground">No changes</p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

