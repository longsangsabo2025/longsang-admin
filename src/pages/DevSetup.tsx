import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const isDev = import.meta.env.DEV;

export function DevSetup() {
  const [loading, setLoading] = useState(false);

  const createTestAdmin = async () => {
    setLoading(true);
    try {
      // Try to sign up the test admin user
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'admin123',
        options: {
          data: {
            full_name: 'Test Admin',
            role: 'admin',
          },
        },
      });

      if (error) {
        // If user already exists, that's okay
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.info('Test admin already exists!', {
            description: 'You can use admin@test.com / admin123 to login',
          });
        } else {
          throw error;
        }
      } else {
        toast.success('Test admin created!', {
          description: 'Email: admin@test.com | Password: admin123',
        });
      }
    } catch (error: any) {
      console.error('Create admin error:', error);
      toast.error('Failed to create test admin', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      });

      if (error) throw error;

      toast.success('Login test successful!', {
        description: 'Test admin account is working correctly',
      });
    } catch (error: any) {
      toast.error('Login test failed', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createAndLogin = async () => {
    setLoading(true);
    try {
      // First, try to create the account with email confirmation disabled
      const { error: signUpError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'admin123',
        options: {
          data: {
            full_name: 'Test Admin',
            role: 'admin',
          },
          emailRedirectTo: undefined,
        },
      });

      console.log('SignUp result:', { signUpError });

      // Wait a bit for the account to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123',
      });

      console.log('SignIn result:', { data, signInError });

      if (signInError) {
        // If sign in fails, provide detailed error
        if (signInError.message.includes('Email not confirmed')) {
          toast.error('Email confirmation required', {
            description: 'Please check Supabase dashboard to disable email confirmation or confirm the email manually.',
            duration: 7000,
          });
        } else if (signInError.message.includes('Invalid login credentials')) {
          toast.error('Account not ready yet', {
            description: 'Please wait a moment and try "Test Login" button, or check your Supabase dashboard.',
            duration: 7000,
          });
        } else {
          throw signInError;
        }
        return;
      }

      toast.success('Success!', {
        description: 'Account created and logged in!',
      });
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        globalThis.location.href = '/automation';
      }, 1000);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error('Setup failed', {
        description: error.message || 'Please check console for details',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isDev) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page is only available in development mode.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Development Setup</h1>
        <p className="text-muted-foreground">
          Quick setup tools for development environment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Test Admin Account
          </CardTitle>
          <CardDescription>
            Create and test the admin account for development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">admin@test.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">admin123</span>
            </div>
          </div>

          <Button
            onClick={createAndLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            🚀 Create & Login Now!
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={createTestAdmin}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Create Only
            </Button>
            <Button
              onClick={testLogin}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Test Login
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This account is automatically created when you use the Quick Login button.
              Use this page only if you need to manually verify the setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Development Features</CardTitle>
          <CardDescription>
            Features available in development mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Quick Login button with one-click admin access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Password authentication (no email verification needed)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Toggle between password and magic link authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Auto-confirmed email addresses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">⚠</span>
              <span className="text-muted-foreground">
                All dev features are automatically disabled in production
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
