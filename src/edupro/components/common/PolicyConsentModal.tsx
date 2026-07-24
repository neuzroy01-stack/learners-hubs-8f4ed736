import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Shield, CheckCircle, FileText, Lock, AlertCircle } from 'lucide-react';

export const PolicyConsentModal: React.FC = () => {
  const { currentUser, acceptPolicy } = useAuth();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [isChecked, setIsChecked] = useState(false);

  const settings = db.getSettings();

  // Only show if user is a student and has not accepted policy
  if (!currentUser || currentUser.role !== 'student' || currentUser.policyAccepted) {
    return null;
  }

  const handleAgree = () => {
    if (!isChecked) return;
    acceptPolicy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Student Policy Consent Required</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                {settings.name} • Policy Version {settings.policy.version}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold border border-amber-400/30">
            <Lock className="w-3.5 h-3.5 mr-1" />
            Action Required
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-6 py-3 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Welcome, <strong className="font-semibold">{currentUser.name}</strong>! As part of your first-time login onboarding, please review and accept our institutional Terms & Conditions and Data Privacy Policy to unlock your student dashboard and courses.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy & Data Protection</span>
          </button>
        </div>

        {/* Policy Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          {activeTab === 'terms' ? settings.policy.termsContent : settings.policy.privacyContent}
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
              I have read, understood, and agree to the Terms & Privacy Policy
            </span>
          </label>

          <button
            onClick={handleAgree}
            disabled={!isChecked}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-md ${
              isChecked
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>I Agree & Unlock Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
