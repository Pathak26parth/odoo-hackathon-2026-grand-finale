import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Zap,
  Users,
  Camera,
  Calculator,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  BarChart3,
  Cpu,
  Clock,
  ChevronRight,
  Database,
  Eye,
  FileText,
  BadgeCheck,
  TrendingUp,
  AlertCircle,
  Building2,
  Play,
  RotateCcw,
  Check,
  Fingerprint,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, login } = useAuth();

  // Theme state: defaults to 'light' to strictly match the other frontend panels
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('peoplepay360_home_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('peoplepay360_home_theme', nextTheme);
    } catch {
      // fallback
    }
  };

  const isDark = theme === 'dark';

  // Role login loading state
  const [loggingInRole, setLoggingInRole] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Active interactive demo simulator tab
  const [activeTab, setActiveTab] = useState('biometrics'); // 'biometrics' | 'payroll'

  // Biometric Simulator State
  const [selectedCandidate, setSelectedCandidate] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Candidates for Biometric Demo
  const candidates = [
    {
      name: 'Alex Rivera',
      code: 'EMP-005',
      dept: 'Engineering & Tech',
      role: 'Senior Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      confidence: 99.4,
      liveness: 'PASS (0.985)',
      status: 'PRESENT • ON-TIME'
    },
    {
      name: 'Sarah Jenkins',
      code: 'EMP-004',
      dept: 'Human Resources',
      role: 'Head of Human Resources',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      confidence: 98.9,
      liveness: 'PASS (0.992)',
      status: 'PRESENT • EARLY'
    },
    {
      name: 'Priya Sharma',
      code: 'EMP-006',
      dept: 'Engineering & Tech',
      role: 'Senior UI/UX Designer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      confidence: 99.7,
      liveness: 'PASS (0.998)',
      status: 'PRESENT • ON-TIME'
    }
  ];

  // Trigger simulated face scan
  const handleTriggerScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(candidates[selectedCandidate]);
    }, 1400);
  };

  // Payroll Rule Engine Simulator State
  const [monthlyWage, setMonthlyWage] = useState(95000);

  // Dynamic Rule calculations matching PeoplePay360 Salary Rule Model
  const salaryCalculations = useMemo(() => {
    const wage = Number(monthlyWage) || 0;
    const basic = Math.round(wage * 0.5); // 50% Basic
    const hra = Math.round(basic * 0.5); // 50% of Basic (25% of Wage)
    const sa = Math.max(0, wage - (basic + hra)); // Special Allowance (25% remainder)
    const gross = basic + hra + sa; // Gross = Wage
    const pf = Math.round(basic * 0.12); // 12% PF on Basic
    const pt = 200; // Fixed Statutory PT
    const tds = Math.round(gross * 0.1); // 10% TDS
    const totalDeductions = pf + pt + tds;
    const net = gross - totalDeductions;

    return { wage, basic, hra, sa, gross, pf, pt, tds, totalDeductions, net };
  }, [monthlyWage]);

  // Demo Roles List with Pre-seeded authoritative credentials
  const demoRoles = [
    {
      id: 'admin',
      name: 'System Administrator',
      email: 'admin@peoplepay360.com',
      pass: 'Admin@123',
      badge: 'All Permissions',
      colorLight: 'bg-amber-50 text-amber-700 border-amber-200',
      colorDark: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      icon: Shield,
      desc: 'Master platform privileges, user provisioning, database governance, and role permissions.'
    },
    {
      id: 'hrmanager',
      name: 'HR Manager',
      email: 'hrmanager@peoplepay360.com',
      pass: 'Password@123',
      badge: 'Full HR Operations',
      colorLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      colorDark: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      icon: Users,
      desc: 'Employee directory, digital contracts, working shifts, and multi-tier leave approvals.'
    },
    {
      id: 'payrolladmin',
      name: 'HR Payroll Admin',
      email: 'payrolladmin@peoplepay360.com',
      pass: 'Password@123',
      badge: 'Salary Rules Engine',
      colorLight: 'bg-blue-50 text-blue-700 border-blue-200',
      colorDark: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      icon: Calculator,
      desc: 'Salary structure setup, statutory formula rules, batch payrun execution, and disbursals.'
    },
    {
      id: 'payrolluser',
      name: 'HR Payroll User',
      email: 'payrolluser@peoplepay360.com',
      pass: 'Password@123',
      badge: 'Payrun Specialist',
      colorLight: 'bg-purple-50 text-purple-700 border-purple-200',
      colorDark: 'from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/30',
      icon: FileSpreadsheet,
      desc: 'Compute payruns, review individual employee payslips, and dispatch draft calculations.'
    },
    {
      id: 'employee',
      name: 'Employee (Self-Service)',
      email: 'employee@peoplepay360.com',
      pass: 'Password@123',
      badge: 'Portal Access',
      colorLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      colorDark: 'from-cyan-500/20 to-sky-500/10 text-cyan-400 border-cyan-500/30',
      icon: Fingerprint,
      desc: 'AI face webcam punches, leave balance checks, and instant PDF payslip downloads.'
    }
  ];

  // 1-Click Instant Demo Login
  const handleInstantLogin = async (roleObj) => {
    setLoggingInRole(roleObj.id);
    setLoginError('');
    try {
      const user = await login(roleObj.email, roleObj.pass);
      if (user.role === 'Admin' || user.role === 'HR Payroll Manager' || user.role === 'HR Manager') {
        navigate('/dashboard');
      } else {
        navigate('/employees');
      }
    } catch (err) {
      console.warn('Instant login error:', err);
      setLoginError(`Failed to login as ${roleObj.name}: ${err.message || 'Check credentials'}`);
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDark
          ? 'bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white'
          : 'bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white'
      }`}
    >
      {/* Background Ambience / Subtle Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px] rounded-full" />
            <div className="absolute top-[35%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-emerald-600/15 via-cyan-600/10 to-transparent blur-[140px] rounded-full" />
            <div className="absolute top-[65%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-l from-violet-600/15 via-blue-600/10 to-transparent blur-[140px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent blur-[120px] rounded-full" />
            <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-l from-cyan-100/40 via-blue-50/30 to-transparent blur-[130px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            />
          </>
        )}
      </div>

      {/* STICKY NAVBAR */}
      <nav
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
          isDark
            ? 'bg-slate-950/85 border-slate-800/80 text-white'
            : 'bg-white/90 border-slate-200 text-slate-900 shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  People<span className="text-blue-600">Pay</span>360
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  Odoo Finale
                </span>
              </div>
              <span className={`text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                HR &amp; Payroll Management
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div
            className={`hidden md:flex items-center gap-7 text-xs font-semibold ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#simulators" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>Simulators</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">
              1-Click Roles
            </a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">
              Modules
            </a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">
              Architecture
            </a>
          </div>

          {/* Right Action: Light/Dark Switch & Auth */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline text-[11px] font-semibold">
                {isDark ? 'Light' : 'Dark'}
              </span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className={`text-xs font-semibold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentUser?.name}
                  </span>
                  <span className="text-[10px] text-blue-600 font-mono font-semibold">{currentUser?.role}</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
                >
                  <span>Go to Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="#roles"
                  className={`hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isDark
                      ? 'text-slate-300 hover:text-white bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'text-slate-700 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Login</span>
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Sign In</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${
              isDark
                ? 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Odoo Hackathon 2026 Grand Finale Enterprise Platform</span>
          </div>
        </div>

        {/* Hero Title & Proposition */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Where{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600">
              AI Biometrics
            </span>{' '}
            Meets Zero-Error{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Payroll Operations.
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Unifying employee lifecycle management, 512-D ArcFace biometric facial attendance,
            rule-based statutory formula calculation, and 1-click automated payruns with instant PDF dispatch.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Open Dashboard Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Lock className="w-4 h-4" />
                <span>Launch App / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a
              href="#simulators"
              className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-2 transition-all shadow-2xs hover:scale-[1.01] ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span>Try Live Simulators</span>
            </a>

            <a
              href="#roles"
              className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-2 transition-all ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1-Click Role Logins</span>
            </a>
          </div>

          {/* Quick Credential Hint Banner */}
          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg max-w-md mx-auto flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
        </div>

        {/* HERO METRICS STRIP (Matches MetricCard styling of the dashboard) */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-600">99.98%</div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Calculation Precision
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Automated statutory rules
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">&lt; 1.2s</div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Biometric Verification
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              512-D ArcFace with Liveness
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-600">27 Tables</div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Normalized 3NF DB
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pure SQL, zero ORM latency
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-600">5 Roles</div>
            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Enterprise RBAC
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Granular permission matrix
            </div>
          </div>
        </div>

        {/* HERO OPERATIONS CENTER PREVIEW CARD */}
        <div
          className={`mt-12 max-w-5xl mx-auto rounded-2xl p-5 sm:p-7 border transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div
                className={`text-xs font-mono font-medium flex items-center gap-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>|</span>
                <span>peoplepay360.internal/operations-center</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Payrun Engine Active
              </span>
            </div>
          </div>

          {/* Quick Hero UI Preview 3-Column Grid */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Biometric Verification Feed */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Live AI Biometrics
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">99.4% Match</span>
                </div>

                <div
                  className={`rounded-lg p-3 flex items-center gap-3 border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
                    alt="Alex Rivera"
                    className="w-12 h-12 rounded-lg object-cover border border-blue-500/50 shrink-0"
                  />
                  <div className="text-xs">
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alex Rivera</div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      EMP-005 • Software Eng
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      PUNCH VERIFIED • 08:58 AM
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <span>Liveness: Anti-Spoof PASS</span>
                <span className="text-blue-600 font-semibold font-mono">ArcFace 512-D</span>
              </div>
            </div>

            {/* Card 2: Batch Payrun Status */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    Batch Payrun Wizard
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PAID
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Payrun Period</span>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      August 2026 Batch
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Eligible Staff</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      6 / 6 Processed
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Net Disbursal</span>
                    <span className="text-emerald-600 font-mono font-bold">₹5,02,800.00</span>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <span>PDF Payslips</span>
                <span className="text-emerald-600 font-semibold">100% Dispatched</span>
              </div>
            </div>

            {/* Card 3: Real-Time Salary Rule Breakdown */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 text-cyan-600" />
                    Dynamic Rule Engine
                  </span>
                  <span className="text-cyan-600 font-mono text-[11px] font-semibold">Formula Active</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>Basic (50%):</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ₹47,500
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>HRA (50% of Basic):</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ₹23,750
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>Special Allowance:</span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ₹23,750
                    </span>
                  </div>
                  <div
                    className={`flex justify-between font-bold pt-1 border-t text-emerald-600 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <span>Take-Home Net:</span>
                    <span className="font-mono">₹73,300</span>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <span>Statutory Compliance</span>
                <span className="text-cyan-600 font-semibold font-mono">PF + PT + TDS Lock</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 1-CLICK INSTANT DEMO ROLES (FOR JUDGES & EVALUATORS) */}
      <section
        id="roles"
        className={`relative z-10 py-16 border-y transition-colors ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Hackathon Evaluator Access</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Experience Every Perspective in 1 Click
            </h2>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              The platform implements full 5-role enterprise RBAC. Click any role below to instantly authenticate
              and navigate to that role's customized workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {demoRoles.map((roleObj) => {
              const RoleIcon = roleObj.icon;
              const isLoggingIn = loggingInRole === roleObj.id;

              return (
                <div
                  key={roleObj.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md group ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          isDark ? roleObj.colorDark : roleObj.colorLight
                        }`}
                      >
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {roleObj.badge}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold group-hover:text-blue-600 transition-colors ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {roleObj.name}
                    </h3>
                    <p className={`text-[11px] mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {roleObj.desc}
                    </p>
                  </div>

                  <div
                    className={`mt-5 pt-3 border-t space-y-2 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-mono break-all ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <span className="font-semibold">Email:</span> {roleObj.email}
                    </div>

                    <button
                      onClick={() => handleInstantLogin(roleObj)}
                      disabled={isLoggingIn}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-60 ${
                        isDark
                          ? 'bg-slate-800 hover:bg-blue-600 text-white'
                          : 'bg-white hover:bg-blue-600 text-slate-800 hover:text-white border border-slate-200 hover:border-blue-600'
                      }`}
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
                          <span>Logging In...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>1-Click Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE SIMULATORS (THE "WOW" FACTOR) */}
      <section id="simulators" className="relative z-10 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-Time Interactive Sandbox</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Test the Core Engines Live
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Interact directly with our dual flagship subsystems: ArcFace Biometric Facial Recognition and
            the Dynamic Formula Salary Rules Computation Engine.
          </p>

          {/* Tab Switcher */}
          <div
            className={`mt-6 inline-flex p-1 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setActiveTab('biometrics')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'biometrics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>1. AI Biometric Face Scanner</span>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'payroll'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>2. Dynamic Salary Rule Engine</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BIOMETRIC SCANNER SIMULATOR */}
        {activeTab === 'biometrics' && (
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Left: Interactive Camera Viewport */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-xl flex items-center justify-center">
                {/* Candidate Image as Video Feed */}
                <img
                  src={candidates[selectedCandidate].avatar}
                  alt={candidates[selectedCandidate].name}
                  className="w-full h-full object-cover filter contrast-105"
                />

                {/* Simulated Facial Landmark Mesh and Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-48 h-56 rounded-3xl border-2 transition-all duration-300 relative ${
                      isScanning
                        ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)] scale-105'
                        : scanResult
                        ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                        : 'border-blue-400/50'
                    }`}
                  >
                    {/* Reticle Corner Marks */}
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-white" />

                    {/* Animated Scanning Line */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg" />
                    )}

                    {/* Facial Landmark Dots */}
                    <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-2 h-1 rounded bg-cyan-400" />
                  </div>
                </div>

                {/* Top Status Bar in Camera */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white px-3 py-1.5 rounded-lg bg-slate-950/70 backdrop-blur-md border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>REC • HD 1080P</span>
                  </div>
                  <span className="text-cyan-400 font-semibold">ARCFACE 512-D</span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 text-center">
                  {isScanning ? (
                    <div className="px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-semibold backdrop-blur-md flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      <span>Extracting Cosine Embeddings &amp; Liveness...</span>
                    </div>
                  ) : scanResult ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-semibold backdrop-blur-md flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{scanResult.status} (MATCH: {scanResult.confidence}%)</span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-medium backdrop-blur-md">
                      Face within reticle • Click "Trigger Scan" below
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="mt-5 flex gap-3 w-full max-w-md">
                <button
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isScanning ? 'Extracting Vector...' : 'Trigger Biometric Scan'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidate((prev) => (prev + 1) % candidates.length);
                    setScanResult(null);
                  }}
                  className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Switch Candidate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Next Face</span>
                </button>
              </div>
            </div>

            {/* Right: Biometric Extraction Analysis & Audit telemetry */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>1:1 Identity Verification &amp; Anti-Spoof</span>
                  <BadgeCheck className="w-5 h-5 text-blue-600" />
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Evaluates 512-dimensional floating-point face vector embeddings against pre-enrolled baseline
                  hashes using cosine similarity distance with strict active anti-spoof liveness detection.
                </p>
              </div>

              {/* Select Employee Subject */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select Enrolled Employee:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {candidates.map((cand, idx) => (
                    <button
                      key={cand.code}
                      onClick={() => {
                        setSelectedCandidate(idx);
                        setScanResult(null);
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                        selectedCandidate === idx
                          ? isDark
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <img src={cand.avatar} alt={cand.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold truncate">{cand.name}</div>
                        <div className={`text-[9px] font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {cand.code}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Telemetry Card */}
              <div
                className={`p-4 rounded-xl border space-y-3 font-mono text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`flex justify-between items-center pb-2 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Biometric Model:</span>
                  <span className="text-blue-600 font-semibold">InsightFace ArcFace-ResNet50</span>
                </div>
                <div
                  className={`flex justify-between items-center pb-2 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Vector Coordinates:</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>512 FP32 Dimensions</span>
                </div>
                <div
                  className={`flex justify-between items-center pb-2 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Liveness Protection:</span>
                  <span className="text-emerald-600 font-semibold">
                    {scanResult ? scanResult.liveness : 'MediaPipe Depth & Texture'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Dual Resilience:</span>
                  <span className="text-amber-600 font-semibold">Microservice + DB Hash Fallback</span>
                </div>
              </div>

              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero raw video stored. Only one-way hashed embeddings are retained for GDPR compliance.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYROLL RULES ENGINE SIMULATOR */}
        {activeTab === 'payroll' && (
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-md'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Left: Interactive Wage Slider & Rule Sequencer */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>Dynamic Salary Rule Calculator</span>
                  <Calculator className="w-5 h-5 text-indigo-600" />
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Adjust the contractual wage slider below to watch the ordered rule hierarchy execute in real-time
                  according to the active PeoplePay360 formula specification.
                </p>
              </div>

              {/* Slider Controller */}
              <div
                className={`p-5 rounded-xl border space-y-4 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-end">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Contractual Monthly Wage:
                  </label>
                  <span className="text-2xl font-bold text-blue-600 font-mono">
                    ₹{salaryCalculations.wage.toLocaleString('en-IN')}
                  </span>
                </div>

                <input
                  type="range"
                  min="30000"
                  max="250000"
                  step="5000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div
                  className={`flex justify-between text-[10px] font-mono ${
                    isDark ? 'text-slate-500' : 'text-slate-500'
                  }`}
                >
                  <span>₹30,000 / mo</span>
                  <span>₹1,40,000 / mo</span>
                  <span>₹2,50,000 / mo</span>
                </div>
              </div>

              {/* Formula Hierarchy Tags */}
              <div className="space-y-2">
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Executed Rule Hierarchy:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-blue-600 font-bold">BASIC:</span> contract.wage * 0.50
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-cyan-600 font-bold">HRA:</span> BASIC * 0.50
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-indigo-600 font-bold">SA:</span> wage - (BASIC + HRA)
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-purple-600 font-bold">PF:</span> BASIC * 0.12 (Statutory)
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-amber-600 font-bold">PT:</span> ₹200 (Fixed State Tax)
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-rose-600 font-bold">TDS:</span> GROSS * 0.10 (Bracket)
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual Breakdown Card & Net Result */}
            <div
              className={`lg:col-span-6 p-6 rounded-xl border space-y-6 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-3 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs uppercase font-bold tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Itemized Calculation Breakdown
                </span>
                <span className="text-xs font-mono text-emerald-600 font-bold">Structure: REG_SAL_2026</span>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-600 flex items-center justify-between">
                  <span>Gross Earnings:</span>
                  <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    +₹{salaryCalculations.gross.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pl-3 border-l-2 border-blue-400 space-y-1 text-xs font-mono">
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• Basic Pay (50%)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.basic.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• House Rent Allowance (25%)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.hra.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• Special Allowance (25%)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.sa.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-rose-600 flex items-center justify-between">
                  <span>Statutory Deductions:</span>
                  <span className="font-mono text-sm font-bold text-rose-600">
                    -₹{salaryCalculations.totalDeductions.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pl-3 border-l-2 border-rose-400 space-y-1 text-xs font-mono">
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• Provident Fund (12% of Basic)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.pf.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• Professional Tax (PT)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.pt.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>• Tax Deducted at Source (TDS 10%)</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      ₹{salaryCalculations.tds.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Net Pay Highlight */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Calculated Net Take-Home Salary
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Disbursal after statutory lock
                  </div>
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600">
                  ₹{salaryCalculations.net.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6 DEEP MODULES SHOWCASE */}
      <section
        id="modules"
        className={`relative z-10 py-20 border-y transition-colors ${
          isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Modular Architecture</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              End-to-End Workforce Operations
            </h2>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Every workflow is interconnected without data silos—from initial employee onboarding to automated batch
              salary computation and digital A4 payslip delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Unified Employee Lifecycle
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Complete employee records with organizational hierarchy, automated contract binding, working shift
                assignments, masked bank credentials, and PII protection.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>Smart sub-resource action buttons</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>Auto leave allocation on onboarding</span>
                </li>
              </ul>
            </div>

            {/* Module 2 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                2. Biometric Face Attendance
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Integrated browser webcam punch system with active 512-D ArcFace verification, MediaPipe anti-spoof
                protection, shift matching, and overtime calculation.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sub-second facial identity matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dual resilience with DB fallback</span>
                </li>
              </ul>
            </div>

            {/* Module 3 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                3. Time Off Quotas &amp; Approvals
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Paid, Casual, Sick, and Unpaid leave type management with yearly balance tracking, 2-tier approval
                workflows, and real-time deductions from payruns.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dynamic quota allocation tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span>Automatic deduction from pay period</span>
                </li>
              </ul>
            </div>

            {/* Module 4 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                4. Dynamic Salary Rules Engine
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Configurable salary structures with ordered rule execution (`BASIC`, `HRA`, `GROSS`, `PF`, `PT`, `TDS`,
                `NET`), formula evaluation, and statutory brackets.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mathematical formula execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Salary structure versioning</span>
                </li>
              </ul>
            </div>

            {/* Module 5 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                5. Payrun Wizard &amp; PDF Payslips
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                4-stage payrun lifecycle (`Draft` → `Computed` → `Validated` → `Paid`) with safety locks, batch
                computation, one-click PDF payslips, and email delivery.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>Batch contract eligibility check</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600" />
                  <span>Print-ready A4 PDF generation</span>
                </li>
              </ul>
            </div>

            {/* Module 6 */}
            <div
              className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${
                isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                6. Real-Time Analytics &amp; Reports
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Executive dashboard widgets, monthly payroll cost variance, department expenditure breakdowns,
                attendance trends, and exportable compliance reports.
              </p>
              <ul className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Live interactive metrics &amp; charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Departmental cost distributions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE & SECURITY HIGHLIGHTS */}
      <section id="architecture" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${
              isDark
                ? 'bg-purple-500/10 border-purple-500/25 text-purple-400'
                : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>High-Performance Engineering</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Architected for Sub-Millisecond Speed &amp; Security
          </h2>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Built with strict design standards: raw parameterized SQL queries, zero ORM translation overhead, and dual
            JWT token rotation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-blue-600 mb-3">
              <Database className="w-8 h-8" />
            </div>
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pure SQL Engine (`mysql2`)
            </h4>
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Strictly NO ORM. Parameterized queries avoid heavy object-relational mapping latency, execute atomic ACID
              transactions, and guarantee total injection immunity.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-emerald-600 mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dual JWT &amp; Bcrypt-12
            </h4>
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              15-minute short-lived access tokens paired with 7-day refresh tokens securely hashed in MySQL via SHA-256.
              Passwords protected by Bcrypt with 12 salt rounds.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="text-cyan-600 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dual-Resilient Biometrics
            </h4>
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Python ArcFace microservice provides real-time 512-D neural embeddings. If offline, the Node.js backend
              seamlessly falls back to resilient database hash matching.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section
        className={`relative z-10 py-16 border-t transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-blue-900/20 via-slate-900/40 to-slate-950 border-slate-800'
            : 'bg-gradient-to-b from-blue-50/60 via-white to-slate-100 border-slate-200'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Explore PeoplePay360?
          </h2>
          <p className={`text-sm max-w-xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Experience the future of integrated enterprise HR and automated payroll right now. Test as an Admin, HR
            Manager, or Employee.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Launch PeoplePay360</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#roles"
              className={`px-6 py-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1-Click Role Matrix</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`relative z-10 py-10 border-t text-xs transition-colors ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-slate-500'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>PeoplePay360</span>
            <span>&bull; Developed for Odoo Hackathon 2026 Grand Finale</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span>Node.js v22 &bull; React 19 &bull; MySQL 8</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
