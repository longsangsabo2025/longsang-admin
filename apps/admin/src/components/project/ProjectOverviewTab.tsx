import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Key,
  Users,
  FileText,
  TrendingUp,
  Share2,
  Plug,
  RefreshCw,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface ProjectOverviewTabProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: string;
    icon: string;
    color: string;
    created_at: string;
    updated_at: string;
  };
  projectId: string;
  onRefresh: () => void;
}

export function ProjectOverviewTab({ project, projectId }: ProjectOverviewTabProps) {
  const [stats, setStats] = useState({
    credentials: 0,
    domains: 0,
    socialLinks: 0,
    integrations: 0,
    loading: true,
  });

  // Check if using fallback project (not in database)
  const isFallback = projectId.startsWith('fallback-');

  useEffect(() => {
    if (!isFallback) {
      fetchStats();
    } else {
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [projectId, isFallback]);

  const fetchStats = async () => {
    try {
      const [credRes, domainRes, socialRes, intRes] = await Promise.all([
        supabaseAdmin.from('credentials_vault').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabaseAdmin.from('project_domains').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabaseAdmin.from('project_social_links').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabaseAdmin.from('project_integrations').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
      ]);

      setStats({
        credentials: credRes.count || 0,
        domains: domainRes.count || 0,
        socialLinks: socialRes.count || 0,
        integrations: intRes.count || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    { label: 'API Keys', value: stats.credentials, icon: Key, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Domains', value: stats.domains, icon: Globe, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { label: 'Social Links', value: stats.socialLinks, icon: Share2, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { label: 'Integrations', value: stats.integrations, icon: Plug, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    {stats.loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Thông Tin Dự Án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Slug</span>
              <code className="bg-muted px-2 py-1 rounded text-sm">{project.slug}</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: project.color }}
                />
                <code className="text-sm">{project.color}</code>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Ngày tạo
              </span>
              <span className="text-sm">
                {new Date(project.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Cập nhật
              </span>
              <span className="text-sm">
                {new Date(project.updated_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open(`https://${project.slug}.vercel.app`, '_blank')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Mở Production Site
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open(`http://localhost:5173`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Mở Dev Server
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Supabase Dashboard
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Vercel Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Mô Tả Dự Án</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {project.description || 'Chưa có mô tả cho dự án này.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
