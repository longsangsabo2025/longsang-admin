/**
 * Execution Report Dialog
 * Dialog for exporting execution reports with options
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText } from 'lucide-react';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import {
  exportExecutionReport,
  ExecutionReportOptions,
} from '@/lib/visual-workspace/executionReportExporter';
import { useToast } from '@/hooks/use-toast';

interface ExecutionReportDialogProps {
  trigger?: React.ReactNode;
}

export function ExecutionReportDialog({ trigger }: ExecutionReportDialogProps) {
  const { history } = useExecutionHistory();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'html' | 'text'>('html');
  const [includeSteps, setIncludeSteps] = useState(true);
  const [includeErrors, setIncludeErrors] = useState(true);

  const handleExport = () => {
    if (history.length === 0) {
      toast({
        title: 'No data',
        description: 'No execution history to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      const options: ExecutionReportOptions = {
        format,
        includeSteps,
        includeErrors,
      };

      exportExecutionReport(history, options);

      toast({
        title: 'Export successful',
        description: `Exported ${history.length} execution(s) as ${format.toUpperCase()}`,
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Execution Report</DialogTitle>
          <DialogDescription>
            Export {history.length} execution(s) in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="format-html" />
                <Label htmlFor="format-html" className="font-normal cursor-pointer">
                  HTML (Formatted, best for viewing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="font-normal cursor-pointer">
                  JSON (Structured data)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="format-text" />
                <Label htmlFor="format-text" className="font-normal cursor-pointer">
                  Text (Plain text)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-steps"
                  checked={includeSteps}
                  onCheckedChange={(checked) => setIncludeSteps(checked as boolean)}
                />
                <Label htmlFor="include-steps" className="font-normal cursor-pointer">
                  Include execution steps
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-errors"
                  checked={includeErrors}
                  onCheckedChange={(checked) => setIncludeErrors(checked as boolean)}
                />
                <Label htmlFor="include-errors" className="font-normal cursor-pointer">
                  Include error messages
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
