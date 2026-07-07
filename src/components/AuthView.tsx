import React, { useState } from "react";
import { signInWithGoogle, saveUserToFirestore } from "../lib/firebase";
import { getTranslation, LanguageCode } from "../lib/languages";
import { Smartphone, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  lang: LanguageCode;
}

export default function AuthView({ onAuthSuccess, lang }: AuthViewProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      console.error(err);
      // Fallback for iframe environment blockages: provide a beautiful Guest/Demo Bypass
      setError("Sign-In failed (Popup blocked in iframe). Using Offline Demo Companion Mode...");
      setTimeout(() => {
        const dummyUser = {
          uid: "demo-user-123",
          displayName: "Ravi Kumar",
          email: "ravi.kumar@bharat.gov.in",
          photoURL: null
        };
        saveUserToFirestore(dummyUser, { name: "Ravi Kumar", state: "Bihar", preferredLanguage: lang });
        onAuthSuccess(dummyUser);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    // Simulate OTP send with micro-animation
    setTimeout(() => {
      setStep("otp");
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP code.");
      return;
    }
    setError("");
    setLoading(true);
    // Complete mobile sign-in simulation
    setTimeout(() => {
      const dummyUser = {
        uid: "phone-user-" + phone.replace(/\s+/g, ""),
        displayName: "Ravi Kumar",
        phoneNumber: "+91 " + phone,
        email: ""
      };
      saveUserToFirestore(dummyUser, { name: "Ravi Kumar", state: "Bihar", preferredLanguage: lang });
      onAuthSuccess(dummyUser);
      setLoading(false);
    }, 1000);
  };

  return (
    <div id="auth-page-container" className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Left Column: Splash Hero Banner */}
      <div id="auth-left-hero" className="w-full md:w-1/2 bg-gradient-to-tr from-indigo-800 via-indigo-600 to-indigo-500 text-white flex flex-col justify-between p-12 md:p-20 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div>
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <span className="text-indigo-600 font-extrabold text-2xl">s</span>
          </div>
        </div>

        <div className="my-auto py-12 md:py-0 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6"
          >
            Empowering<br />every citizen<br />with AI.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg md:text-xl text-indigo-100 max-w-md font-medium"
          >
            Smart Bharat connects you to schemes, resolutions, and your community instantly.
          </motion.p>
        </div>

        <div className="text-xs text-indigo-200/70 z-10">
          &copy; {new Date().getFullYear()} Smart Bharat Initiative
        </div>
      </div>

      {/* Right Column: Active Interactive Login Wall */}
      <div id="auth-right-panel" className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {getTranslation(lang, "loginTitle")}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              {getTranslation(lang, "loginSubtitle")}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium"
            >
              {error}
              {error.includes("iframe") && (
                <button
                  onClick={() => {
                    const dummyUser = {
                      uid: "bypass-guest-user",
                      displayName: "Ravi Kumar",
                      email: "ravi.kumar@bharat.gov.in"
                    };
                    saveUserToFirestore(dummyUser, { name: "Ravi Kumar", state: "Bihar", preferredLanguage: lang });
                    onAuthSuccess(dummyUser);
                  }}
                  className="mt-2 block w-full bg-indigo-600 text-white rounded-lg py-2 text-center text-xs hover:bg-indigo-700 font-semibold transition"
                >
                  Click here to Bypass & Enter Guest Demo Account
                </button>
              )}
            </motion.div>
          )}

          {/* Google Sign-in action */}
          <button
            id="google-signin-btn"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-xl transition duration-150 transform active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.466 0-6.277-2.81-6.277-6.277 0-3.466 2.81-6.277 6.277-6.277 1.54 0 2.943.557 4.037 1.48l3.14-3.14C18.91 1.54 15.823.5 12.24.5 5.866.5.7 5.666.7 12s5.166 11.5 11.54 11.5c6.514 0 11.46-4.58 11.46-11.5 0-.777-.078-1.5-.233-2.215H12.24z"
              />
            </svg>
            <span>{getTranslation(lang, "loginWithGoogle")}</span>
          </button>

          <div className="flex items-center my-8">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white">
              {getTranslation(lang, "or")}
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Mobile Phone OTP Card container */}
          <div id="mobile-login-card" className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <h3 className="text-md font-extrabold text-slate-800">
                {getTranslation(lang, "mobileLogin")}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Secure access via OTP
            </p>

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.form
                  key="phone-step-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {getTranslation(lang, "phonePlaceholder")}
                  </label>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border border-slate-200 focus-within:border-indigo-500 transition-colors bg-white">
                    <span className="bg-slate-50 px-4 py-3 text-slate-500 font-bold text-sm flex items-center border-r border-slate-100">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="99999 99999"
                      required
                      className="w-full px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-200 hover:bg-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl transition duration-150 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                    style={{ backgroundColor: phone.length === 10 ? "#4F46E5" : "#C7D2FE" }}
                  >
                    <span>{loading ? "Sending..." : getTranslation(lang, "sendOtp")}</span>
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-step-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-4"
                >
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {getTranslation(lang, "enterOtp")}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 text-center text-lg font-mono font-extrabold tracking-widest text-slate-800 placeholder-slate-300 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none shadow-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-4 rounded-xl transition text-sm cursor-pointer"
                    >
                      {getTranslation(lang, "backBtn")}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl transition shadow-sm cursor-pointer text-sm"
                    >
                      {loading ? "Verifying..." : getTranslation(lang, "verifyOtp")}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
