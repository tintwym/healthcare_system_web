import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export const MfaModal: React.FC = () => {
  const { mfaModalOpen, setMfaModalOpen, verifyMfa, currentUser } = useHospital();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [demoCode, setDemoCode] = useState('849102');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  // Rotate simulated TOTP code periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setDemoCode(Math.floor(100000 + Math.random() * 900000).toString());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mfaModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMfa(code || demoCode)) {
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setSuccess(false);
        setCode('');
      }, 1000);
    } else {
      setError('Invalid 6-digit verification token. Please try again.');
    }
  };

  const handleUseDemoCode = () => {
    setCode(demoCode);
  };

  const handleBiometricPasskey = () => {
    setCode(demoCode);
    verifyMfa(demoCode);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCode('');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Multi-Factor Authentication (MFA)</h3>
              <p className="text-xs text-slate-500">HIPAA Identity Verification for {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={() => setMfaModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            &times;
          </button>
        </div>

        {/* Demo Authenticator Generator Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Medicore Yangon Authenticator (TOTP)</span>
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">{secondsRemaining}s</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-mono text-2xl font-bold tracking-widest text-blue-400">
              {demoCode.slice(0, 3)} {demoCode.slice(3)}
            </div>
            <button
              onClick={handleUseDemoCode}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Auto-Fill
            </button>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${(secondsRemaining / 30) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enter 6-digit Authenticator Token
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-widest font-mono text-xl py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 flex items-center space-x-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-600 flex items-center space-x-1 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cryptographic Session Token Approved & Authenticated!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBiometricPasskey}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              <Fingerprint className="h-4 w-4 text-blue-600" />
              <span>Use TouchID / Passkey</span>
            </button>

            <button
              type="submit"
              id="submit-mfa-btn"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Verify Token
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Protected under NIST SP 800-63B</span>
          <span className="font-semibold text-slate-500">Emergency Backup Codes: Enabled</span>
        </div>
      </div>
    </div>
  );
};
