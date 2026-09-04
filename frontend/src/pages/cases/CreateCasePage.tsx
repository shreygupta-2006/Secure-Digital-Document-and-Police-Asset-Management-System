import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/client';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const CreateCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    caseNumber: '',
    title: '',
    description: '',
    status: 'OPEN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.caseNumber.trim() || !form.title.trim()) {
      showToast('Validation', 'Case number and title are required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiClient.post('/api/cases', form);
      showToast('Case Created', `Case ${res.data.caseNumber} has been created.`, 'success');
      navigate(`/cases/${res.data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string }).displayMessage ||
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Could not create case.';
      showToast('Error', msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <button
          onClick={() => navigate('/cases')}
          className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cases', href: '/cases' }, { label: 'Create' }]}
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Create New Case
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4"
      >
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Case Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.caseNumber}
            onChange={(e) => setForm({ ...form, caseNumber: e.target.value })}
            placeholder="e.g. CASE-2025-001"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Investigation into theft at warehouse"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Optional case description..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
          >
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Creating...' : 'Create Case'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-4 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
