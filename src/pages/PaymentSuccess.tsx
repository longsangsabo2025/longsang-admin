import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <p className="text-lg font-medium">Verifying your payment...</p>
              <p className="text-sm text-muted-foreground">
                Session ID: {sessionId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-500/20 p-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
          <CardDescription className="text-base">
            Your subscription has been activated
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-500">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session ID</span>
              <span className="font-mono text-xs">{sessionId?.slice(0, 20)}...</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Thank you for subscribing! You now have access to all premium features.
            </p>
            
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                All premium features unlocked
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Receipt sent to your email
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Subscription auto-renews monthly
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/admin/subscription')}
              className="flex-1"
            >
              View Subscription
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
