import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface LoginModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

const isDev = import.meta.env.DEV;

// Password strength calculator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function LoginModal({ open, onOpenChange, onSuccess }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [mode] = useState('signin' as const);
  const authMethod = 'password' as const;

  const passwordStrength =
    authMethod === 'password' && mode === 'signup' ? getPasswordStrength(password) : null;

  // Validate email on blur
  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Validate password on change
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError('');
    setConfirmPasswordError('');
  };

  // Validate confirm password
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!', {
        description: `Signed in as ${email}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Authentication failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>Enter your admin account and password</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin account</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              onBlur={handleEmailBlur}
              required
              disabled={loading}
              autoFocus
              className={emailError ? 'border-red-500' : ''}
            />
            {emailError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="text-xs">⚠</span> {emailError}
              </p>
            )}
          </div>

          {authMethod === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  disabled={loading}
                  className={passwordError ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="text-xs">⚠</span> {passwordError}
                </p>
              )}

              {/* Password Strength Indicator */}
              {passwordStrength && password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const isActive = i < passwordStrength.score;
                      return (
                        <div
                          key={`bar-${passwordStrength.score}-${i}`}
                          className={`h-1 flex-1 rounded ${
                            isActive ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p
                    className={`text-xs ${(() => {
                      if (passwordStrength.score <= 2) return 'text-red-500';
                      if (passwordStrength.score === 3) return 'text-yellow-500';
                      return 'text-green-500';
                    })()}`}
                  >
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (Signup Only) */}
          {authMethod === 'password' && mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  required
                  disabled={loading}
                  className={confirmPasswordError ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="text-xs">⚠</span> {confirmPasswordError}
                </p>
              )}
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          {authMethod === 'password' && mode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  toast.info('Forgot password?', {
                    description: 'Please contact support for password reset assistance.',
                    duration: 5000,
                  });
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {authMethod === 'password' ? 'Signing in...' : 'Sending magic link...'}
              </>
            ) : authMethod === 'password' ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {mode === 'signin' ? 'Sign in' : 'Sign up'}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {mode === 'signin' ? 'Send magic link' : 'Sign up with email'}
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Admin-only login uses password authentication.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
