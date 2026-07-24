import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { SupportTicket } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageCircle,
  PhoneCall,
  ChevronDown,
  X,
  ExternalLink
} from 'lucide-react';

export const HelpSupportView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Billing & Fee');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const settings = db.getSettings();
  const isFacultyOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  useEffect(() => {
    loadTickets();
    const unsub = db.subscribe(() => loadTickets());
    return unsub;
  }, [currentUser]);

  const loadTickets = () => {
    const list = db.getSupportTickets();
    if (currentRole === 'student' && currentUser) {
      setTickets(list.filter((t) => t.studentId === currentUser.id));
    } else {
      setTickets(list);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      subject,
      category,
      message,
      priority,
      status: 'open',
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.saveSupportTicket(newTicket);
    alert('Support ticket submitted successfully! An academic advisor will respond shortly.');
    setShowCreateModal(false);
    setSubject('');
    setMessage('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !currentUser || !replyMessage) return;

    const updated = db.replySupportTicket(
      selectedTicket.id,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      replyMessage
    );

    if (updated) setSelectedTicket(updated);
    setReplyMessage('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            <span>Help Desk & Academic Support Ticket Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit query tickets, track fee verification status, and connect with academic support.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`https://wa.me/${(settings.phone || '').replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Support</span>
          </a>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List (1 Col) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Support Tickets ({tickets.length})</h3>

          {tickets.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No support tickets found.
            </div>
          ) : (
            tickets.map((tkt) => (
              <div
                key={tkt.id}
                onClick={() => setSelectedTicket(tkt)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 ${
                  selectedTicket?.id === tkt.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {tkt.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    tkt.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tkt.status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{tkt.subject}</h4>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Student: {tkt.studentName}</span>
                  <span>{new Date(tkt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Ticket Thread View (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{selectedTicket.category}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-400">Raised by {selectedTicket.studentName} on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>

                  {isFacultyOrAdmin && (
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => {
                        db.updateSupportTicketStatus(selectedTicket.id, e.target.value as any);
                        setSelectedTicket({ ...selectedTicket, status: e.target.value as any });
                      }}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  )}
                </div>

                {/* Original Query Message */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 mb-4">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Original Issue Message:</div>
                  <p className="leading-relaxed">{selectedTicket.message}</p>
                </div>

                {/* Reply Thread */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                        rep.senderRole === 'admin' || rep.senderRole === 'super_admin'
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 ml-4'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-[11px]">
                        <span>{rep.senderName} ({rep.senderRole})</span>
                        <span className="text-[10px] text-slate-400">{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-snug">{rep.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response reply message..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  required
                />

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs my-auto">
              Select a support ticket from the list to view thread details and reply.
            </div>
          )}
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">Raise New Support Ticket</h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Billing & Fee">Billing & Fee Verification</option>
                  <option value="Course Content">Course Content & Recorded Videos</option>
                  <option value="Certificate">Certificate Generation</option>
                  <option value="Technical Bug">Technical & Portal Glitch</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Fee UTR Payment Pending Verification"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Message Details</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or query in detail..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
