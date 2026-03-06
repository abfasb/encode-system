import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Database, Shield, Zap, Users, BarChart3, FileCheck, Cloud, Lock, CheckCircle, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/DA.png'
import { getAuth, sendPasswordResetEmail } from "firebase/auth";


const AgricultureEncodingLanding = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);c
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


const resetPassword = async () => {
  const auth = getAuth();

  try {
    await sendPasswordResetEmail(auth, "mimaropa.ids@gmail.com");
    alert("Password reset email sent!");
  } catch (error) {
    console.error(error);
  }
};

  const handleLogin = () => {
    navigate('/login')
  }
 
  const features = [
    {
      icon: <Database className="w-8 h-8" />,
      title: "Centralized Data Management",
      description: "Unified database system for all agricultural records, accessible from anywhere, anytime.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Military-Grade Security",
      description: "Bank-level encryption and multi-factor authentication to protect sensitive agricultural data.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning-Fast Processing",
      description: "Process thousands of records in seconds with our optimized encoding engine.",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Instant insights and visualizations to make data-driven agricultural decisions.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-User Collaboration",
      description: "Role-based access control for seamless team collaboration across departments.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <FileCheck className="w-8 h-8" />,
      title: "Automated Validation",
      description: "Smart data validation ensures accuracy and completeness at every step.",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const benefits = [
    "Reduce encoding time by 75%",
    "99.9% uptime guarantee",
    "24/7 technical support",
    "Automatic data backups",
    "Mobile-responsive design",
    "Export to multiple formats"
  ];

  const stats = [
    { value: "500K+", label: "Records Processed" },
    { value: "99.8%", label: "Accuracy Rate" },
    { value: "150+", label: "Active Users" },
    { value: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
                <img src={Logo} alt='DA Logo' className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">DA Encoding System</h1>
                <p className="text-xs text-slate-600">Department of Agriculture</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={handleLogin} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300">
                Get Started
              </button>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-slate-700 hover:text-green-600 font-medium">Features</a>
              <a href="#benefits" className="block text-slate-700 hover:text-green-600 font-medium">Benefits</a>
              <a href="#security" className="block text-slate-700 hover:text-green-600 font-medium">Security</a>
              <button onClick={handleLogin} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Zap className="w-4 h-4" />
                <span>Next-Generation Encoding Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Transform Your Agricultural
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  Data Management
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                The most advanced encoding system designed specifically for the Department of Agriculture. 
                Fast, secure, and incredibly easy to use.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={resetPassword} className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                  Start Encoding Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              
            </div>

            {/* Hero Illustration */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-500">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between bg-white/20 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/30 rounded-lg"></div>
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-white/30 rounded"></div>
                        <div className="w-16 h-2 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  
                  {[1,2,3].map((i) => (
                    <div key={i} className="bg-white/20 rounded-lg p-4 space-y-2 animate-pulse" style={{animationDelay: `${i * 0.2}s`}}>
                      <div className="w-full h-3 bg-white/30 rounded"></div>
                      <div className="w-3/4 h-3 bg-white/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400 rounded-2xl shadow-xl animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500 rounded-full shadow-xl animate-float-delayed"></div>
            </div>
          </div>
        </div>
      </section>


      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 text-white shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Lock className="w-4 h-4" />
                  <span>Enterprise-Grade Security</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                  Your Data is Safe With Us
                </h2>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  We implement the highest security standards to protect your sensitive agricultural data.
                </p>
                <div className="space-y-4">
                  {['256-bit AES Encryption', 'Multi-Factor Authentication', 'Regular Security Audits', 'GDPR Compliant', 'Automatic Backups', 'Role-Based Access Control'].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-lg">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[Shield, Lock, Cloud, FileCheck].map((Icon, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10">
                    <Icon className="w-12 h-12 text-green-400 mb-4" />
                    <h4 className="font-semibold text-lg">Secure</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
     
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-white text-lg">DA Encoding</span>
              </div>
              <p className="text-sm text-slate-400">
                Modern encoding solutions for the Department of Agriculture.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-green-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Training</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2026 Department of Agriculture Encoding System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes progress {
          from { width: 0; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 2s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AgricultureEncodingLanding;
