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
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LoginModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

const isDev = import.meta.env.DEV;

// Check if running locally (dev OR local preview)
const isLocal = isDev || window.location.hostname === 'localhost';

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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<'magiclink' | 'password'>(
    isLocal ? 'password' : 'magiclink'
  );

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
    if (mode === 'signup' && value && value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }

    // Check confirm password match if it's been filled
    if (mode === 'signup' && confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Validate confirm password
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (mode === 'signup' && value && value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (authMethod === 'password' && mode === 'signup' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (authMethod === 'password' && mode === 'signup' && password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (authMethod === 'password') {
        // Password-based authentication (dev mode)
        if (mode === 'signin') {
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
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: globalThis.location.origin,
            },
          });

          if (error) throw error;

          toast.success('Account created!', {
            description: 'Please check your email to verify your account.',
          });

          setMode('signin');
        }
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: globalThis.location.origin,
          },
        });

        if (error) throw error;

        toast.success('Check your email!', {
          description: `Magic link sent to ${email}`,
        });

        setEmail('');
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: 'magic-link-signup', // Required by Supabase but not used for OTP
          options: {
            emailRedirectTo: globalThis.location.origin,
          },
        });

        if (error) throw error;

        toast.success('Check your email!', {
          description: 'Confirmation link sent successfully.',
        });

        setEmail('');
        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Something went wrong';
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
          <DialogDescription>
            {(() => {
              if (authMethod === 'password') return 'Enter your email and password';
              if (mode === 'signin') return 'Enter your email to receive a magic link';
              return 'Sign up to access the automation dashboard';
            })()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
            ) : (
              <>
                {authMethod === 'password' ? (
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
              </>
            )}
          </Button>

          <div className="space-y-2">
            <div className="text-center text-sm">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {isLocal && (
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setAuthMethod(authMethod === 'password' ? 'magiclink' : 'password')
                  }
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  {authMethod === 'password' ? 'Use magic link instead' : 'Use password instead'}
                </button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
