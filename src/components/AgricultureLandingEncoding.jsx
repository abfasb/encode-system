import React, { useState, useEffect, useMemo } from 'react';
import { Menu, X, Database, Shield, Zap, Users, BarChart3, FileCheck, Cloud, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/DA.png';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const AgricultureEncodingLanding = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recordCount, setRecordCount] = useState(482193);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ambient "live" counter — purely cosmetic, gives the hero a pulse without being distracting
  useEffect(() => {
    const interval = setInterval(() => {
      setRecordCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Signature hero visualization: a field/sensor grid, each cell pulsing independently
  const gridCells = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        delay: (Math.random() * 4).toFixed(2),
        duration: (2.5 + Math.random() * 2.5).toFixed(2),
        active: Math.random() > 0.55,
      })),
    []
  );

  const resetPassword = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, 'mimaropa.ids@gmail.com');
      alert('Password reset email sent!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = () => {
    navigate('/choose-character');
  };

  const features = [
    {
      code: 'FLD-01',
      icon: <Database className="w-6 h-6" />,
      title: 'Centralized Records',
      description: 'Every parcel, farmer, and harvest report lives in one database — no more scattered spreadsheets across offices.',
    },
    {
      code: 'FLD-02',
      icon: <Shield className="w-6 h-6" />,
      title: 'Encrypted by Default',
      description: '256-bit encryption and role-based access keep sensitive farmer data locked to those who need it.',
    },
    {
      code: 'FLD-03',
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Encoding',
      description: 'Entries validate and save in real time — built for encoders processing hundreds of records a day.',
    },
    {
      code: 'FLD-04',
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Regional Analytics',
      description: 'Live dashboards turn raw encoding data into yield trends and planting-season forecasts.',
    },
    {
      code: 'FLD-05',
      icon: <Users className="w-6 h-6" />,
      title: 'Team Workspaces',
      description: 'Municipal, provincial, and regional offices work the same dataset without stepping on each other.',
    },
    {
      code: 'FLD-06',
      icon: <FileCheck className="w-6 h-6" />,
      title: 'Automated Checks',
      description: 'Duplicate parcels, missing fields, and outliers get flagged before they ever reach the database.',
    },
  ];

  const stats = [
    { value: '500K+', label: 'Records Processed' },
    { value: '99.8%', label: 'Accuracy Rate' },
    { value: '150+', label: 'Active Encoders' },
    { value: '24/7', label: 'System Uptime' },
  ];

  const yieldSheet = [
    { label: 'Encoding time', value: '−75%' },
    { label: 'Uptime SLA', value: '99.9%' },
    { label: 'Support window', value: '24/7' },
    { label: 'Data backups', value: 'Automatic' },
    { label: 'Device support', value: 'Mobile-ready' },
    { label: 'Export formats', value: 'CSV · XLSX · PDF' },
  ];

  return (
    <div className="min-h-screen bg-[#0A120D] text-[#F2F5EE] overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#0A120D]/90 backdrop-blur-md border-b border-[#C9F26C]/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src={Logo} alt="DA Logo" className="w-11 h-11 rounded-lg shadow-lg" />
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  DA Encoding System
                </h1>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7C8A7B]">
                  Agri-Data Platform · 2026
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-[#A9B5A6] hover:text-[#C9F26C] transition-colors">Features</a>
              <a href="#benefits" className="text-sm text-[#A9B5A6] hover:text-[#C9F26C] transition-colors">The Yield</a>
              <a href="#security" className="text-sm text-[#A9B5A6] hover:text-[#C9F26C] transition-colors">Security</a>
              <button
                onClick={handleLogin}
                className="bg-gradient-to-r from-[#C9F26C] to-[#9FE066] text-[#0A120D] px-6 py-2.5 rounded-lg font-semibold text-sm hover:shadow-[0_0_30px_rgba(201,242,108,0.35)] hover:scale-105 transition-all duration-300"
              >
                Get Started
              </button>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-[#F2F5EE]">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0A120D] border-t border-[#1E2B20]">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-[#A9B5A6] hover:text-[#C9F26C] font-medium">Features</a>
              <a href="#benefits" className="block text-[#A9B5A6] hover:text-[#C9F26C] font-medium">The Yield</a>
              <a href="#security" className="block text-[#A9B5A6] hover:text-[#C9F26C] font-medium">Security</a>
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-[#C9F26C] to-[#9FE066] text-[#0A120D] px-6 py-3 rounded-lg font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 border border-[#C9F26C]/30 text-[#C9F26C] px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9F26C] animate-pulse" />
                Field-to-database, in real time
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold leading-[1.05]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Every hectare,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#C9F26C] to-[#E8A33D]">
                  encoded.
                </span>
              </h1>

              <p className="text-lg text-[#A9B5A6] leading-relaxed max-w-lg">
                The Department of Agriculture's encoding platform — built for the people who turn field
                reports into national data, one record at a time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                  onClick={handleLogin}
                  className="group bg-gradient-to-r from-[#C9F26C] to-[#9FE066] text-[#0A120D] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_0_40px_rgba(201,242,108,0.35)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  Enter the System
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#7C8A7B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9F26C] animate-pulse" />
                  {recordCount.toLocaleString()} records synced today
                </div>
                <button
                  onClick={resetPassword}
                  className="text-xs text-[#7C8A7B] hover:text-[#C9F26C] underline underline-offset-2 text-left w-fit transition-colors"
                >
                  Trouble logging in?
                </button>
              </div>
            </div>

            {/* Signature visual: live field grid */}
            <div className="relative">
              <div className="relative bg-[#0F1A12] border border-[#C9F26C]/15 rounded-3xl p-6 shadow-[0_0_80px_rgba(201,242,108,0.08)] overflow-hidden">
                <div className="flex items-center justify-between mb-4 font-mono text-[10px] tracking-wider text-[#7C8A7B]">
                  <span>14.5995°N 120.9842°E</span>
                  <span className="flex items-center gap-1.5 text-[#C9F26C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9F26C] animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="relative grid grid-cols-8 gap-1.5">
                  {gridCells.map((cell) => (
                    <div
                      key={cell.id}
                      className={`aspect-square rounded-[3px] ${cell.active ? 'bg-[#C9F26C]/70' : 'bg-[#1A2A1D]'}`}
                      style={
                        cell.active
                          ? {
                              animation: `fieldPulse ${cell.duration}s ease-in-out ${cell.delay}s infinite`,
                            }
                          : undefined
                      }
                    />
                  ))}
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9F26C] to-transparent animate-scan-line pointer-events-none" />
                </div>

                <div className="mt-4 font-mono text-[10px] text-[#7C8A7B] flex justify-between">
                  <span>GRID: MIMAROPA-04</span>
                  <span>SYNCED 2s AGO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1E2B20] bg-[#0C140E]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1E2B20]">
          {stats.map((stat, index) => (
            <div key={index} className="text-center py-8 px-4">
              <div className="font-mono text-3xl font-bold text-[#C9F26C]">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-[#7C8A7B] mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-[#E8A33D] mb-3">Capabilities</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Built for the field office
            </h2>
            <p className="text-[#A9B5A6] mt-4 text-lg">
              Six systems that turn a stack of paper forms into a searchable, auditable national dataset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-[#1E2B20] bg-[#0F1A12] p-7 hover:border-[#C9F26C]/40 transition-colors duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-[#16221A] p-3 text-[#C9F26C]">{feature.icon}</div>
                  <span className="font-mono text-xs text-[#7C8A7B]/70">{feature.code}</span>
                </div>
                <h3 className="text-lg font-semibold mt-5">{feature.title}</h3>
                <p className="text-sm text-[#A9B5A6] leading-relaxed mt-2">{feature.description}</p>
                <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-[#C9F26C]/0 via-[#C9F26C]/50 to-[#C9F26C]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Yield (benefits) */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0C140E] border-y border-[#1E2B20]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#E8A33D] mb-3">The Yield</p>
            <h2 className="text-4xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Less paperwork,
              <br />
              more field time.
            </h2>
            <p className="text-[#A9B5A6] mt-5 text-lg leading-relaxed max-w-md">
              Every hour saved encoding is an hour back in the barangay. Here's what offices see after
              switching over.
            </p>
          </div>

          <div className="rounded-2xl border border-[#1E2B20] bg-[#0F1A12] p-8 font-mono text-sm divide-y divide-[#1E2B20]">
            {yieldSheet.map((row, index) => (
              <div key={index} className="flex justify-between py-3.5 first:pt-0 last:pb-0">
                <span className="text-[#A9B5A6]">{row.label}</span>
                <span className="text-[#C9F26C] font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#0F1A12] to-[#0A120D] border border-[#1E2B20] rounded-3xl p-12 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 border border-[#C9F26C]/30 text-[#C9F26C] px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                  <Lock className="w-3.5 h-3.5" />
                  Enterprise-grade security
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Your data is safe with us
                </h2>
                <p className="text-lg text-[#A9B5A6] mb-8 leading-relaxed">
                  We hold agricultural data to the same standard as any national registry — because
                  that's what it is.
                </p>
                <div className="space-y-3.5">
                  {['256-bit AES encryption', 'Multi-factor authentication', 'Regular security audits', 'GDPR-aligned handling', 'Automatic backups', 'Role-based access control'].map(
                    (item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-[#C9F26C] flex-shrink-0" />
                        <span className="text-[#F2F5EE]">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[Shield, Lock, Cloud, FileCheck].map((Icon, index) => (
                  <div
                    key={index}
                    className="bg-[#0F1A12] border border-[#1E2B20] rounded-2xl p-8 hover:border-[#C9F26C]/40 hover:bg-[#12201580] transition-all duration-300 hover:scale-105"
                  >
                    <Icon className="w-10 h-10 text-[#C9F26C] mb-4" />
                    <h4 className="font-semibold">Secure</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to put the season online?
          </h2>
          <p className="text-[#A9B5A6] text-lg mb-8">Sign in and pick up where your office left off.</p>
          <button
            onClick={handleLogin}
            className="group bg-gradient-to-r from-[#C9F26C] to-[#9FE066] text-[#0A120D] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-[0_0_40px_rgba(201,242,108,0.35)] hover:scale-105 transition-all duration-300 inline-flex items-center"
          >
            Start Encoding Now
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A120D] border-t border-[#1E2B20] text-[#A9B5A6] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#16221A] rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#C9F26C]" />
                </div>
                <span className="font-bold text-[#F2F5EE] text-lg">DA Encoding</span>
              </div>
              <p className="text-sm text-[#7C8A7B]">Modern encoding infrastructure for the Department of Agriculture.</p>
            </div>

            <div>
              <h4 className="font-semibold text-[#F2F5EE] mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-[#C9F26C] transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-[#C9F26C] transition-colors">The Yield</a></li>
                <li><a href="#security" className="hover:text-[#C9F26C] transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#F2F5EE] mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Training</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#F2F5EE] mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-[#C9F26C] transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1E2B20] pt-8 text-center text-sm text-[#7C8A7B]">
            <p>&copy; 2026 Department of Agriculture Encoding System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fieldPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .animate-scan-line {
          position: absolute;
          animation: scanLine 4s linear infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.9s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-scan-line,
          [style*="fieldPulse"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgricultureEncodingLanding;