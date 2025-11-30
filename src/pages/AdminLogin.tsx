import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail, ArrowLeft, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const isDev = import.meta.env.DEV;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      // Dev bypass - create fake session
      if (isDev) {
        // Store dev session flag
        localStorage.setItem('dev-auth-bypass', 'true');
        localStorage.setItem('dev-user-email', 'admin@test.com');
        
        sonnerToast.success('Quick login successful! (Dev Mode)', {
          description: 'Logged in as admin@test.com',
        });
        
        // Redirect using window.location to ensure auth state updates
        window.location.href = "/admin";
        return;
      }

      // Production mode - use real auth
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      });

      if (error) {
        // If failing, show helpful message
        sonnerToast.error('Quick login needs setup', {
          description: 'Please visit /dev-setup to create admin account first',
          duration: 5000,
        });
        return;
      }

      sonnerToast.success('Quick login successful!', {
        description: 'Logged in as admin@test.com',
      });
      
      navigate("/admin");
    } catch (error: any) {
      sonnerToast.error('Quick login failed', {
        description: 'Visit /dev-setup to create admin account',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin role
      const userRole = data.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        toast({
          title: "Access denied",
          description: "Admin privileges required",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged into Admin Portal",
      });

      // Use window.location to ensure auth state updates properly
      window.location.href = "/admin";
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Login Card */}
        <Card className="border-2">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
            <CardDescription className="text-base">
              Sign in to access your AI Automation Control Center
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Quick Login Button (Dev Mode Only) */}
            {isDev && (
              <>
                <Button
                  type="button"
                  onClick={handleQuickLogin}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mb-4"
                  size="lg"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Login as Admin (Dev)
                </Button>
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In to Admin Portal"}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>This is a protected admin area</p>
              <p className="mt-1">Only authorized users can access</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Secure Access</p>
                <p>All login attempts are monitored and logged for security purposes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
