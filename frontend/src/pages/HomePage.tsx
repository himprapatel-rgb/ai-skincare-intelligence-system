import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Sparkles, 
  ShieldCheck, 
  FlaskConical, 
  FileText, 
  ArrowRight, 
  Upload, 
  Cpu, 
  CheckCircle2, 
  Star,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-rose-500 to-violet-600 text-white p-2 rounded-xl group-hover:shadow-lg transition-all duration-300">
            <Scan size={24} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            SkinAI
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it Works', 'Science', 'Reviews'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-slate-600 hover:text-rose-500 font-medium transition-colors">
              {item}
            </a>
          ))}
          <Link 
            to="/scan" 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-semibold hover:bg-slate-800 transition-all transform hover:scale-105 shadow-lg shadow-slate-900/20"
          >
            Start Scan
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-slate-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl py-8 px-6 flex flex-col gap-4 border-t border-slate-100 animate-fade-in-down">
          {['Features', 'How it Works', 'Science', 'Reviews'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
              className="text-lg font-medium text-slate-700 py-2 border-b border-slate-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link 
            to="/scan" 
            className="mt-4 w-full py-3 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-center rounded-xl font-bold"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Start AI Scan
          </Link>
        </div>
      )}
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: string }) => (
  <div className={`p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 ${delay}`}>
    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc, icon: Icon }: { number: string, title: string, desc: string, icon: any }) => (
  <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto group">
    <div className="w-20 h-20 rounded-full bg-white border-4 border-rose-100 flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 group-hover:border-rose-200 transition-all duration-300 relative">
      <Icon size={32} className="text-rose-500" />
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500">{desc}</p>
  </div>
);

const DemoPhone = () => (
  <div className="relative mx-auto border-slate-900 bg-slate-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden">
    <div className="h-[32px] w-[3px] bg-slate-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
    <div className="h-[46px] w-[3px] bg-slate-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
    <div className="h-[64px] w-[3px] bg-slate-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
      {/* Mock Screen Content */}
      <div className="absolute top-0 w-full h-full bg-slate-50 flex flex-col">
        <div className="h-40 bg-gradient-to-b from-rose-400 to-rose-200 p-6 flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/90 text-sm font-medium">Skin Score</p>
              <h2 className="text-white text-4xl font-bold">92<span className="text-lg font-normal">/100</span></h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
        <div className="flex-1 p-5 overflow-hidden">
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-800">Analysis</h4>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Excellent</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Hydration</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full mt-1.5"><div className="w-[85%] h-full bg-blue-400 rounded-full"></div></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Texture</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full mt-1.5"><div className="w-[92%] h-full bg-rose-400 rounded-full"></div></div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h4 className="font-bold text-slate-800 mb-3">Your Routine</h4>
            <div className="flex gap-3 overflow-x-hidden">
              <div className="min-w-[80px] h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <FlaskConical size={24} className="text-violet-400" />
              </div>
              <div className="min-w-[80px] h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <Upload size={24} className="text-rose-400" />
              </div>
              <div className="min-w-[80px] h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <CheckCircle2 size={24} className="text-teal-400" />
              </div>
            </div>
          </div>
        </div>
        {/* Floating Action Button */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
           <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
             View Report <ChevronRight size={16}/>
           </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Page ---

const HomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rose-200">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-rose-300/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-300/30 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-100 text-rose-600 font-semibold text-sm mb-6 animate-fade-in shadow-sm">
                <Sparkles size={16} />
                <span>#1 AI Dermatologist Tech</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Your skin, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-600">
                  decoded in seconds.
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Advanced computer vision analyzes 150+ skin attributes to build your perfect, science-backed skincare routine instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link 
                  to="/scan" 
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <Scan size={20} />
                  Start AI Scan
                </Link>
                <Link 
                  to="/features" 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                >
                  Explore Features
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" /> No signup required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" /> 98% Accuracy
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 relative w-full flex justify-center lg:justify-end">
               <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 to-violet-600 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
                 <DemoPhone />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Professional Grade Analysis</h2>
            <p className="text-lg text-slate-600">We combine medical-grade AI with dermatologist expertise to give you clarity on your skin's health.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Cpu}
              title="Fast AI Analysis" 
              desc="Get a comprehensive skin audit in under 5 seconds. Our engine detects acne, wrinkles, texture, and more."
              delay="delay-0"
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Privacy First" 
              desc="Your photos are analyzed locally or encrypted instantly. We never sell your biometric data to third parties."
              delay="delay-100"
            />
            <FeatureCard 
              icon={FlaskConical}
              title="Personalized Routines" 
              desc="Stop guessing. Get a morning and night routine tailored specifically to your skin type and concerns."
              delay="delay-200"
            />
            <FeatureCard 
              icon={Sparkles}
              title="Product Match" 
              desc="Our database of 10,000+ products is filtered to find ingredients that actually work for your biology."
              delay="delay-300"
            />
            <FeatureCard 
              icon={FileText}
              title="Professional Reports" 
              desc="Download detailed PDF reports to share with your dermatologist or aesthetician."
              delay="delay-400"
            />
             <FeatureCard 
              icon={Scan}
              title="Progress Tracking" 
              desc="Scan weekly to visualize improvements with our time-lapse skin evolution technology."
              delay="delay-500"
            />
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">3 Steps to Better Skin</h2>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-rose-200 via-violet-200 to-rose-200 border-t-2 border-dashed border-slate-300 z-0" />
            
            <div className="grid md:grid-cols-3 gap-12">
              <StepCard 
                number="1"
                icon={Upload}
                title="Upload Selfie"
                desc="Take a clear photo in natural light. No makeup, glasses off."
              />
              <StepCard 
                number="2"
                icon={Cpu}
                title="AI Analysis"
                desc="Our neural network scans for 20+ distinct skin conditions instantly."
              />
              <StepCard 
                number="3"
                icon={Sparkles}
                title="Get Results"
                desc="Receive your personalized routine and product recommendations."
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Social Proof */}
      <section id="reviews" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Trusted by 50,000+ Users</h2>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <span className="font-bold text-slate-700">4.9/5 Average Rating</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: "I finally understand why my expensive creams weren't working. The AI analysis pointed out I have dehydrated oily skin, not dry skin!",
                author: "Sarah J.",
                role: "Member since 2023"
              },
              {
                text: "The routine builder is a game changer. It simplified my 10-step routine down to 4 effective steps and my skin has never looked better.",
                author: "Michael T.",
                role: "Acne Prone Skin"
              },
              {
                text: "Better than my last derm visit. The detailed breakdown of my pores and texture gave me actionable goals to work towards.",
                author: "Elena R.",
                role: "Skincare Enthusiast"
              }
            ].map((review, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <div className="flex text-yellow-400 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-700 mb-6 italic">"{review.text}"</p>
                <div>
                  <p className="font-bold text-slate-900">{review.author}</p>
                  <p className="text-sm text-slate-500">{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to transform your skin?</h2>
              <p className="text-slate-300 text-lg mb-10">Join thousands of others decoding their skin health today. It takes less than a minute.</p>
              
              <Link 
                to="/scan" 
                className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-rose-50 transition-all transform hover:scale-105"
              >
                Scan My Skin Now
                <ArrowRight size={20} />
              </Link>
              <p className="mt-6 text-slate-400 text-sm">No credit card required • Free analysis included</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-8 border-t border-slate-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                  <Scan size={20} />
                </div>
                <span className="text-xl font-bold text-slate-900">SkinAI</span>
              </Link>
              <p className="text-slate-500 max-w-sm">
                Empowering you with dermatological intelligence for smarter, safer, and more effective skincare decisions.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-rose-500">Skin Scan</a></li>
                <li><a href="#" className="hover:text-rose-500">Routine Builder</a></li>
                <li><a href="#" className="hover:text-rose-500">Ingredient Checker</a></li>
                <li><a href="#" className="hover:text-rose-500">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-rose-500">About Us</a></li>
                <li><a href="#" className="hover:text-rose-500">Medical Board</a></li>
                <li><a href="#" className="hover:text-rose-500">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-rose-500">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-8 text-center text-slate-400 text-sm">
            © {new Date().getFullYear()} AI Skin Intelligence. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
