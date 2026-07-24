import React from 'react';
import { Certificate } from '../../types/lms';
import { db } from '../../services/db';
import { Printer, X, Award, ShieldCheck } from 'lucide-react';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const settings = db.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Toolbar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Official Academic Graduation Certificate</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div id="printable-certificate" className="p-10 bg-amber-50/30 text-slate-900 relative border-[12px] border-amber-600/30 font-serif">
          <div className="border-2 border-amber-600/60 p-8 rounded-lg relative text-center bg-white shadow-sm">
            {/* Corner Ornamental Flourishes */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-700" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-700" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-700" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-700" />

            {/* Header */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg border-2 border-amber-200">
                <Award className="w-9 h-9" />
              </div>
            </div>

            <p className="text-xs font-sans tracking-[0.3em] text-amber-800 uppercase font-bold mb-1">
              {settings.name}
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-wide text-slate-900 mb-2">
              Certificate of Completion
            </h1>
            <p className="text-xs font-sans text-slate-500 uppercase tracking-widest mb-6">
              THIS CERTIFICATE IS PROUDLY PRESENTED TO
            </p>

            {/* Student Name */}
            <div className="mb-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-blue-900 italic border-b border-amber-400/60 pb-2 inline-block px-8">
                {certificate.studentName}
              </h2>
            </div>

            <p className="text-sm font-sans text-slate-600 max-w-xl mx-auto leading-relaxed mb-6">
              for successfully completing all academic requirements, practical projects, and evaluations for the program:
            </p>

            {/* Course Title */}
            <h3 className="text-2xl font-sans font-black text-slate-900 tracking-tight mb-2">
              {certificate.courseTitle}
            </h3>
            <p className="text-xs font-sans text-amber-700 font-bold mb-8">
              Grade Awarded: {certificate.grade}
            </p>

            {/* Verification Footer */}
            <div className="grid grid-cols-3 items-end pt-8 border-t border-slate-200 text-xs font-sans">
              <div className="text-left">
                <p className="font-mono text-[11px] text-slate-500 font-bold">Issue Date: {certificate.issueDate}</p>
                <p className="font-mono text-[10px] text-slate-400">Code: {certificate.certificateNumber}</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-50 flex flex-col items-center justify-center text-[9px] font-bold text-amber-900 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-amber-600 mb-0.5" />
                  <span>VERIFIED</span>
                </div>
              </div>

              <div className="text-right">
                <div className="w-36 h-10 border-b border-slate-400 ml-auto mb-1 flex items-end justify-center text-[10px] italic text-slate-400">
                  Director of Academic Affairs
                </div>
                <p className="font-bold text-slate-800">Academic Governing Board</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
