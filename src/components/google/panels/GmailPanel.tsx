/**
 * Gmail Panel - Email Management Component
 * Send emails and view email statistics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  BarChart3,
} from 'lucide-react';
import { sendEmail, getEmailStats } from '@/lib/google/gmail-api';
import { toast } from 'sonner';

export const GmailPanel = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getEmailStats(30);
      setStats(data);
    } catch (error) {
      console.error('Error loading email stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      const fromEmail = 'automation-bot-102@long-sang-automation.iam.gserviceaccount.com';
      await sendEmail(fromEmail, {
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
      });
      toast.success('Email sent successfully!');
      setEmailForm({ to: '', subject: '', body: '' });
      await loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.successful || 0}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Bounced/Failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Delivery rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Send Email Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Email
          </CardTitle>
          <CardDescription>Send email using Google service account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={emailForm.to}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message here..."
              rows={5}
              value={emailForm.body}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Emails</CardTitle>
            <CardDescription>Last 10 sent emails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentLogs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium">{log.subject || 'No subject'}</div>
                    <div className="text-xs text-muted-foreground">{log.to_email}</div>
                  </div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
