import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, FolderOpen, ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const ManagerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'manager') {
        navigate('/manager');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('[ManagerLogin] Attempting login for:', email);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[ManagerLogin] Auth response:', { error, user: data?.user?.id, role: data?.user?.user_metadata?.role });

      if (error) throw error;

      // Check user role
      const userRole = data.user?.user_metadata?.role;
      
      if (userRole === 'admin') {
        sonnerToast.success('Xin chào Admin!', {
          description: 'Đang chuyển hướng đến Admin Portal...',
        });
        // Use navigate instead of window.location to avoid reload
        navigate('/admin');
        return;
      }
      
      if (userRole !== 'manager') {
        toast({
          title: 'Không có quyền truy cập',
          description: 'Tài khoản này không phải Manager. Vui lòng liên hệ Admin.',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
        return;
      }

      sonnerToast.success('Đăng nhập thành công!', {
        description: 'Chào mừng bạn đến Manager Portal',
      });

      // Use navigate instead of window.location to avoid reload
      navigate('/manager');
    } catch (error: any) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message === 'Invalid login credentials' 
          ? 'Email hoặc mật khẩu không đúng' 
          : error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-500/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Login Card */}
        <Card className="border-2">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
              <Lock className="h-10 w-10" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Manager Portal</CardTitle>
              <CardDescription className="text-base mt-2">
                Đăng nhập để quản lý dự án của bạn
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
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
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600" 
                size="lg" 
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              Sau khi đăng nhập, bạn có thể:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Quản lý Dự án</p>
                  <p className="text-xs text-muted-foreground">Xem và chỉnh sửa các dự án được phân quyền</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <p className="font-medium">Thư Viện Media</p>
                  <p className="text-xs text-muted-foreground">Quản lý hình ảnh và tài liệu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 LongSang Admin System</p>
          <p className="mt-1">Liên hệ admin nếu bạn quên mật khẩu</p>
        </div>
      </div>
    </div>
  );
};

export default ManagerLogin;
