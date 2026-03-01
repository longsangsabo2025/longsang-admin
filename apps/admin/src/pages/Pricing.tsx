import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans, getUserSubscription } from '@/lib/subscription/api';
import { redirectToCheckout } from '@/lib/stripe/api';
import { redirectToVNPay } from '@/lib/vnpay/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PricingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'vnpay'>('vnpay'); // Default to VNPay for VN

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  });

  const { data: userSub } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: () => getUserSubscription(),
  });

  const currentPlan = (userSub?.plan as any)?.name || 'free';

  const handleUpgrade = async (planName: string, planId: string) => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Yêu cầu đăng nhập',
          description: 'Vui lòng đăng nhập để nâng cấp gói',
          variant: 'destructive',
        });
        navigate('/admin/login');
        return;
      }

      if (planName === 'free') {
        navigate('/admin');
        return;
      }

      // Redirect based on payment method
      if (paymentMethod === 'vnpay') {
        await redirectToVNPay(planId, user.id);
      } else {
        await redirectToCheckout(planId, user.id, 'monthly');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Nâng cấp thất bại',
        description: error instanceof Error ? error.message : 'Không thể khởi tạo thanh toán',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[600px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Chọn Gói Phù Hợp</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Bắt đầu miễn phí và mở rộng theo nhu cầu. Tất cả gói đều có tính năng AI automation.
        </p>

        {/* Payment Method Toggle */}
        <Tabs
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'vnpay')}
          className="w-full max-w-md mx-auto mb-8"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vnpay">🇻🇳 VNPay (VND)</TabsTrigger>
            <TabsTrigger value="stripe">💳 Stripe (USD)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans?.map((plan) => {
          const isCurrentPlan = currentPlan === plan.name;
          const isPopular = plan.name === 'pro';
          const features = plan.features as Record<string, string>;

          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? 'border-primary shadow-xl scale-105' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500">Current Plan</Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.display_name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>

                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold">${plan.price_monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {plan.price_yearly > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      or ${plan.price_yearly}/year (save $
                      {Math.round(plan.price_monthly * 12 - plan.price_yearly)})
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'secondary'}
                  disabled={isCurrentPlan || loading}
                  onClick={() => handleUpgrade(plan.name, plan.id)}
                >
                  {loading
                    ? 'Processing...'
                    : isCurrentPlan
                      ? 'Current Plan'
                      : plan.name === 'free'
                        ? 'Get Started'
                        : 'Upgrade Now'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Need a custom plan for your organization?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
