import { Button } from '@/components/ui/button';
import { Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';

export interface ConnectionsHeaderProps {
  showTokens: boolean;
  onToggleTokens: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export const ConnectionsHeader = ({
  showTokens,
  onToggleTokens,
  loading,
  onRefresh,
}: ConnectionsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Social Media Connections</h1>
        <p className="text-muted-foreground">
          Quản lý tất cả các kết nối social media trong một nơi
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onToggleTokens}>
          {showTokens ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showTokens ? 'Hide Tokens' : 'Show Tokens'}
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh All
        </Button>
      </div>
    </div>
  );
};
