import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Activity,
  Globe2,
  Zap,
  Shield,
  Users,
  BarChart3,
} from 'lucide-react';
import authService from '@/services/authService';
import { toast } from 'sonner';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        toast.success(`Welcome back, ${response.user?.name}!`);
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials: Record<
    'admin' | 'manager' | 'viewer',
    { email: string; password: string }
  > = {
    admin: { email: 'admin@trends.com', password: 'admin123' },
    manager: { email: 'manager@trends.com', password: 'manager123' },
    viewer: { email: 'viewer@trends.com', password: 'viewer123' },
  };

  const handleDemoLogin = async (role: 'admin' | 'manager' | 'viewer') => {
    setError('');
    setIsLoading(true);
    try {
      const creds = demoCredentials[role];
      const response = await authService.login({
        email: creds.email,
        password: creds.password,
      });
      if (response.success) {
        toast.success(`Signed in to ${role} demo account`);
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block text-white animate-fade-in-left">
            <div className="space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                    <TrendingUp className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Reliance Trends
                  </h1>
                  <p className="text-white/70 text-sm">Intelligence Portal</p>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h2 className="text-5xl font-bold leading-tight">
                  Welcome
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Please sign in to continue
                  </span>
                </h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  Secure access to your dashboard.
                </p>
              </div>

              {/* Feature Cards (kept generic) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        Analytics
                      </h3>
                      <p className="text-sm text-white/70">Insights & trends</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg">
                      <Globe2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Access</h3>
                      <p className="text-sm text-white/70">Anywhere</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        AI Assist
                      </h3>
                      <p className="text-sm text-white/70">Optional</p>
                    </div>
                  </div>
                </div>

                <div className="group bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Filters</h3>
                      <p className="text-sm text-white/70">Fast</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats - kept removed */}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto animate-fade-in-right">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 pb-6">
                <h2 className="text-3xl font-bold text-white text-center mb-2">
                  Sign In
                </h2>
                <p className="text-white/80 text-center">
                  Use your credentials to continue
                </p>
              </div>

              <div className="p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-white/90 text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/40
                          focus:bg-white/15 focus:border-purple-400 focus:ring-purple-400/20
                          transition-all duration-300 rounded-xl
                          ${focusedField === 'email' ? 'scale-[1.02]' : ''}
                        `}
                        required
                        disabled={isLoading}
                      />
                      <Mail
                        className={`
                        absolute left-4 top-3.5 h-5 w-5 transition-colors duration-300
                        ${focusedField === 'email' ? 'text-purple-400' : 'text-white/40'}
                      `}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-white/90 text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`
                          pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/40
                          focus:bg-white/15 focus:border-purple-400 focus:ring-purple-400/20
                          transition-all duration-300 rounded-xl
                          ${focusedField === 'password' ? 'scale-[1.02]' : ''}
                        `}
                        required
                        disabled={isLoading}
                      />
                      <Lock
                        className={`
                        absolute left-4 top-3.5 h-5 w-5 transition-colors duration-300
                        ${focusedField === 'password' ? 'text-purple-400' : 'text-white/40'}
                      `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-white/40 hover:text-white/60 transition-colors duration-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={checked =>
                          setRememberMe(checked as boolean)
                        }
                        className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm cursor-pointer text-white/80"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="px-0 text-sm text-purple-400 hover:text-purple-300"
                    >
                      Forgot password?
                    </Button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {/* Demo quick access */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <Button
                      type="button"
                      onClick={() => handleDemoLogin('admin')}
                      variant="outline"
                      className="h-11 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      <Shield className="w-4 h-4 mr-2" /> Admin
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDemoLogin('manager')}
                      variant="outline"
                      className="h-11 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      <Users className="w-4 h-4 mr-2" /> Manager
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDemoLogin('viewer')}
                      variant="outline"
                      className="h-11 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" /> Viewer
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-white/50 text-sm mt-6">
              © 2024 Reliance Trends. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
