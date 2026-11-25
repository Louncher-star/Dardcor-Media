'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, BarChart2, Check } from 'lucide-react';
import { PollData } from '@/types';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: PollData) => void;
}

export function CreatePollModal({ isOpen, onClose, onCreatePoll }: CreatePollModalProps) {
  const [mounted, setMounted] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleAddOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const isValid = question.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const pollData: PollData = {
      question: question.trim(),
      options: validOptions.map((text, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text,
        votes: [],
      })),
      allow_multiple: allowMultiple,
      total_votes: 0,
    };

    onCreatePoll(pollData);
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[var(--wa-bg-sidebar)] border border-[var(--wa-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[var(--wa-header-bg)] border-b border-[var(--wa-border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <h3 className="font-semibold text-base text-[var(--wa-text-primary)]">
              Buat Jajak Pendapat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text-primary)] hover:bg-[var(--wa-hover)] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--wa-text-secondary)] uppercase tracking-wider">
              Pertanyaan
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Tanyakan sesuatu..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={255}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)] focus:outline-none focus:border-[#00a884] transition"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--wa-text-secondary)] uppercase tracking-wider block">
              Pilihan Jawaban (Minimal 2, Maksimal 12)
            </label>
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--wa-text-secondary)] w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Opsi ${idx + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    maxLength={100}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--wa-header-bg)] border border-[var(--wa-border)] text-sm text-[var(--wa-text-primary)] placeholder:text-[var(--wa-text-secondary)] focus:outline-none focus:border-[#00a884] transition"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-[var(--wa-text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0"
                      title="Hapus opsi"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 12 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#00a884] hover:text-[#06cf9c] px-3 py-2 rounded-lg hover:bg-[#00a884]/10 transition"
              >
                <Plus size={16} />
                <span>Tambah Opsi Lain</span>
              </button>
            )}
          </div>

          {/* Toggle Multiple Answers */}
          <div className="pt-2 border-t border-[var(--wa-border)]/50 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-[var(--wa-text-primary)] block">
                Izinkan beberapa jawaban
              </span>
              <span className="text-xs text-[var(--wa-text-secondary)] block">
                Peserta dapat memilih lebih dari satu opsi
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAllowMultiple(!allowMultiple)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                allowMultiple ? 'bg-[#00a884]' : 'bg-[var(--wa-hover)] border border-[var(--wa-border)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  allowMultiple ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-3 bg-[var(--wa-header-bg)] border-t border-[var(--wa-border)] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)] transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#00a884] hover:bg-[#06cf9c] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>Kirim Polling</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
