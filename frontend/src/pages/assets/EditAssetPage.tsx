import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Box,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAssetByIdApi, updateAssetApi } from '../../api/assets';
import { AssetCategory, AssetStatus, AssetCondition } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';

export const EditAssetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    assetCode: '',
    serialNumber: '',
    category: 'FIREARM' as AssetCategory,
    manufacturer: '',
    model: '',
    status: 'AVAILABLE' as AssetStatus,
    condition: 'GOOD' as AssetCondition,
    currentLocation: '',
    purchaseDate: '',
    purchaseCost: 0,
    warrantyExpiry: '',
    notes: '',
  });

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);

  useEffect(() => {
    if (!id) return;
    const fetchAsset = async () => {
      setIsLoading(true);
      try {
        const data = await getAssetByIdApi(id);
        setFormData({
          name: data.name,
          assetCode: data.assetCode,
          serialNumber: data.serialNumber || '',
          category: (data.category || 'OTHER') as AssetCategory,
          manufacturer: data.manufacturer || '',
          model: data.modelNumber || data.model || '',
          status: data.status,
          condition: data.condition || 'GOOD',
          currentLocation: data.location || data.currentLocation || '',
          purchaseDate: data.purchaseDate || '',
          purchaseCost: data.purchasePrice || data.purchaseCost || 0,
          warrantyExpiry: data.warrantyExpiryDate || data.warrantyExpiry || '',
          notes: data.notes || '',
        });

        if (data.specifications) {
          const loadedSpecs = Object.entries(data.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecs(loadedSpecs);
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        setErrorMessage(errorObj.message || 'Failed to load asset details for editing.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const specificationsObject: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specificationsObject[s.key.trim()] = s.value.trim();
        }
      });

      await updateAssetApi(id, {
        assetCode: formData.assetCode,
        name: formData.name,
        serialNumber: formData.serialNumber,
        category: formData.category,
        manufacturer: formData.manufacturer,
        modelNumber: formData.model,
        status: formData.status,
        condition: formData.condition,
        location: formData.currentLocation,
        purchasePrice: Number(formData.purchaseCost) || 0,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiryDate: formData.warrantyExpiry || null,
        description: formData.notes,
        specifications: specificationsObject,
      });

      showToast('Asset Updated', `Changes to ${formData.assetCode} saved successfully.`, 'success');
      navigate(`/assets/${id}`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setErrorMessage(errorObj.message || 'Failed to save asset modifications.');
      showToast('Update Failed', errorObj.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (errorMessage && !formData.name) {
    return (
      <ErrorState
        title="Asset Load Error"
        message={errorMessage}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', href: '/dashboard' },
              { label: 'Assets', href: '/assets' },
              { label: formData.assetCode, href: `/assets/${id}` },
              { label: 'Edit Record' },
            ]}
          />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Modify Asset Record: <span className="font-mono text-blue-700">{formData.assetCode}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Update asset status, technical specs, or physical assignment location.
          </p>
        </div>

        <Link
          to={`/assets/${id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-100">
            Nomenclature & Serial Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Asset Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Asset Tag Code
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.assetCode}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-blue-700 font-mono font-medium cursor-not-allowed opacity-80"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Serial Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="FIREARM">FIREARM</option>
                <option value="VEHICLE">VEHICLE</option>
                <option value="COMMUNICATION">COMMUNICATION</option>
                <option value="TACTICAL">TACTICAL</option>
                <option value="ELECTRONICS">ELECTRONICS</option>
                <option value="EVIDENCE_TECH">EVIDENCE_TECH</option>
                <option value="UNIFORM">UNIFORM</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Model / Trim
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-100">
            Disposition, Condition & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Physical Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Current Location / Station
              </label>
              <input
                type="text"
                required
                value={formData.currentLocation}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Extended Technical Specifications
            </h3>
            <button
              type="button"
              onClick={handleAddSpec}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Attribute</span>
            </button>
          </div>

          <div className="space-y-2">
            {specs.map((spec, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Attribute"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  aria-label="Remove attribute"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            Operational Protocol Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            to={`/assets/${id}`}
            className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Asset Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
