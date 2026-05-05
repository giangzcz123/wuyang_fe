import React, { useState } from "react";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { request } from "../api/apiClient";

const SignInPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    UserName: "",
    PassWord: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await request("/login.php", {
        method: "POST",
        body: formData,
      });

      if (result.success) {
        localStorage.setItem("user", JSON.stringify(result.user));
        toast.success("Success", `Welcome ${result.user.FullName}!`);

        if (result.user.UserRole === "Cashier") {
          window.location.href = "/cashier";
        } else if (result.user.UserRole === "Kitchen") {
          window.location.href = "/kitchen";
        } else if (result.user.UserRole === "Admin" || result.user.UserRole === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      } else {
        toast.error("Sign In Failed", result.error || "Invalid username or password!");
      }
    } catch (error) {
      toast.error("System Error", "Server connection failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF1CA] flex items-center justify-center relative overflow-hidden font-serif selection:bg-[#B8860B] selection:text-white">
      {/* Background Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale"
        style={{
          backgroundImage: "url('/chinese_bg_pattern.png')",
          backgroundSize: "400px",
          backgroundRepeat: "repeat"
        }}
      ></div>

      {/* Decorative Cloud SVGs / Corner Brackets */}
      <div className="absolute top-0 left-0 w-32 h-32 md:w-64 md:h-64 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-[#850A0A]">
          <path d="M0 0 L40 0 L40 2 L2 2 L2 40 L0 40 Z" />
          <circle cx="10" cy="10" r="2" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 md:w-64 md:h-64 opacity-20 pointer-events-none rotate-180">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-[#850A0A]">
          <path d="M0 0 L40 0 L40 2 L2 2 L2 40 L0 40 Z" />
          <circle cx="10" cy="10" r="2" />
        </svg>
      </div>

      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[#850A0A] hover:text-[#B8860B] transition-all group"
      >
        <div className="p-2 border border-[#850A0A] rounded-full group-hover:border-[#B8860B]">
          <ArrowLeft size={20} />
        </div>
        <span className="hidden md:inline font-bold tracking-widest uppercase text-xs">Return</span>
      </button>

      <main className="relative z-10 w-full max-w-5xl mx-4 bg-[#FDFBF7] shadow-[20px_20px_60px_rgba(0,0,0,0.1)] flex flex-col md:flex-row min-h-[600px] border border-[#850A0A]/20">
        {/* Left Section - Ink Landscape */}
        <div className="hidden md:flex w-1/2 relative bg-[#F5F5F5] overflow-hidden border-r border-[#850A0A]/10">
          <img
            src="/logo.svg"
            alt="landscape"
            className="w-full h-[80%] object-cover transition-transform duration-[10000ms] hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FDFBF7]/10"></div>

          {/* Vertical Title Overlay */}
          <div className="absolute top-12 left-12 h-full py-8 pointer-events-none flex flex-col justify-start items-center gap-4">
            <div className="w-px h-12 bg-[#850A0A]"></div>
            <p className="[writing-mode:vertical-rl] text-[#850A0A] tracking-[0.5em] text-sm uppercase font-bold opacity-70">
              Restaurant Management System
            </p>
            <div className="w-6 h-8 border-2 border-[#850A0A] flex items-center justify-center">
              <span className="text-[#850A0A] text-[10px] font-bold">海底</span>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
          {/* Subtle Decorative elements for the form area */}
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-[#850A0A] mb-2 tracking-tight">
              Sign In
            </h1>
            <div className="w-16 h-1 bg-[#B8860B] mb-4 mx-auto md:mx-0"></div>
            <p className="text-gray-500 text-sm">Please enter your credentials to access the system.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 group">
              <label className="block text-xs uppercase tracking-widest font-bold text-[#850A0A] group-focus-within:text-[#B8860B] transition-colors">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#850A0A]/40 group-focus-within:text-[#B8860B]">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="UserName"
                  value={formData.UserName}
                  onChange={handleChange}
                  required
                  placeholder="admin_staff"
                  className="w-full bg-transparent border-b-2 border-[#850A0A]/20 focus:border-[#B8860B] py-3 pl-10 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-xs uppercase tracking-widest font-bold text-[#850A0A] group-focus-within:text-[#B8860B] transition-colors">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#850A0A]/40 group-focus-within:text-[#B8860B]">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="PassWord"
                  value={formData.PassWord}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b-2 border-[#850A0A]/20 focus:border-[#B8860B] py-3 pl-10 pr-10 outline-none transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B8860B]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative w-4 h-4 border border-[#850A0A] group-hover:border-[#B8860B] transition-colors">
                  <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="absolute inset-0.5 bg-[#B8860B] scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-tighter">Remember Me</span>
              </label>
              <a href="#" className="text-xs text-[#850A0A] hover:text-[#B8860B] transition-colors uppercase tracking-widest font-bold">
                Forgot?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full relative overflow-hidden bg-[#850A0A] text-white py-4 font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#6b0808] transition-all group active:scale-[0.98] ${loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <span className="relative z-10">{loading ? "Authenticating..." : "Sign In"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000"></div>
            </button>
          </form>

          {/* Bottom Footer Decoration */}
          <div className="mt-16 flex items-center justify-between gap-4 opacity-30">
            <div className="h-px flex-1 bg-[#850A0A]"></div>
            <div className="w-4 h-4 rotate-45 border border-[#850A0A]"></div>
            <div className="h-px flex-1 bg-[#850A0A]"></div>
          </div>
        </div>
      </main>

      {/* Extreme Bottom Decorative Seal */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40">
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#850A0A] mb-2 font-bold">Establish 1994</p>
        <div className="w-8 h-8 rounded-sm bg-[#850A0A] flex items-center justify-center text-white font-bold text-xs ring-2 ring-offset-2 ring-[#850A0A]">
          海底
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
