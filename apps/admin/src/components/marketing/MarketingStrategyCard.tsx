/**
 * MarketingStrategyCard - Quick actions for marketing strategy
 * Suggestions and tools based on marketing docs analysis
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingStrategyCardProps {
  projectSlug: string;
  projectName: string;
  hasMarketingPack: boolean;
  documentCount: number;
  onActionClick?: (action: string) => void;
}

interface StrategyItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'pending';
  action: string;
  icon: any;
}

const STRATEGY_SUGGESTIONS: StrategyItem[] = [
  {
    id: 'content-calendar',
    title: 'Lập Content Calendar 30 ngày',
    description: 'Lên kế hoạch nội dung cho 4 tuần tới',
    priority: 'high',
    status: 'pending',
    action: 'create-calendar',
    icon: Calendar,
  },
  {
    id: 'visual-assets',
    title: 'Chuẩn bị Visual Assets',
    description: 'Logo, screenshots, banners cho social media',
    priority: 'high',
    status: 'pending',
    action: 'create-assets',
    icon: Sparkles,
  },
  {
    id: 'launch-campaign',
    title: 'Tạo Launch Campaign',
    description: 'Chiến dịch ra mắt sản phẩm',
    priority: 'medium',
    status: 'pending',
    action: 'create-campaign',
    icon: Megaphone,
  },
  {
    id: 'target-audience',
    title: 'Xác định Target Audience',
    description: 'Phân tích và xây dựng user personas',
    priority: 'medium',
    status: 'pending',
    action: 'define-audience',
    icon: Users,
  },
  {
    id: 'kpi-setup',
    title: 'Thiết lập KPIs',
    description: 'Đặt mục tiêu và metrics theo dõi',
    priority: 'low',
    status: 'pending',
    action: 'setup-kpis',
    icon: Target,
  },
];

const PRIORITY_COLORS = {
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export function MarketingStrategyCard({ 
  projectSlug, 
  projectName,
  hasMarketingPack,
  documentCount,
  onActionClick 
}: MarketingStrategyCardProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Calculate completion percentage based on docs
  const completionPercentage = hasMarketingPack 
    ? Math.min(100, Math.round((documentCount / 8) * 100))
    : 0;

  // Get suggestions based on current state
  const suggestions = STRATEGY_SUGGESTIONS.map(item => ({
    ...item,
    status: hasMarketingPack && documentCount >= 5 
      ? (item.priority === 'high' ? 'in-progress' : 'pending') as const
      : 'pending' as const,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Marketing Strategy
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completionPercentage}% hoàn thành
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tài liệu: {documentCount}/8</span>
            <span>
              {completionPercentage < 50 ? 'Bắt đầu' : completionPercentage < 80 ? 'Đang tiến hành' : 'Gần hoàn thành'}
            </span>
          </div>
        </div>

        {/* Strategy Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Đề xuất tiếp theo
          </h4>
          
          <div className="space-y-2">
            {suggestions.slice(0, 4).map(item => {
              const Icon = item.icon;
              const isExpanded = expandedItem === item.id;
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    isExpanded ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      item.status === 'completed' 
                        ? "bg-green-500/10" 
                        : item.status === 'in-progress'
                        ? "bg-blue-500/10"
                        : "bg-muted"
                    )}>
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : item.status === 'in-progress' ? (
                        <Icon className="h-4 w-4 text-blue-500 animate-pulse" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1", PRIORITY_COLORS[item.priority])}
                        >
                          {item.priority === 'high' ? 'Ưu tiên' : item.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                        </Badge>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <Button 
                            size="sm" 
                            className="h-7 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionClick?.(item.action);
                            }}
                          >
                            Bắt đầu <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs font-medium text-amber-600 mb-1">💡 Marketing Tip</p>
          <p className="text-xs text-muted-foreground">
            {hasMarketingPack 
              ? "Bắt đầu với Content Calendar để lên kế hoạch bài đăng cho 30 ngày tới."
              : "Tạo Marketing Pack trước để có template chuẩn cho tất cả tài liệu marketing."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketingStrategyCard;
