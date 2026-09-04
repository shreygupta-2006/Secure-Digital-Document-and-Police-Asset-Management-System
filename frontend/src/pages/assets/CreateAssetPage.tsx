import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createAssetApi } from '../../api/assets';
import { AssetCategory, AssetStatus, AssetCondition } from '../../types';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const CreateAssetPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    assetCode: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
    serialNumber: '',
    category: 'FIREARM' as AssetCategory,
    manufacturer: '',
    model: '',
    status: 'AVAILABLE' as AssetStatus,
    condition: 'EXCELLENT' as AssetCondition,
    currentLocation: 'Central Armory - Vault A',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    warrantyExpiry: '',
    notes: '',
  });

  const getCategoryDefaults = (cat: AssetCategory): Array<{ key: string; value: string }> => {
    switch (cat) {
      case 'FIREARM':
        return [
          { key: 'Caliber / Spec', value: '' },
          { key: 'Capacity', value: '' },
        ];
      case 'VEHICLE':
        return [
          { key: 'VIN', value: '' },
          { key: 'License Plate', value: '' },
        ];
      case 'ELECTRONICS':
        return [
          { key: 'Processor', value: '' },
          { key: 'RAM', value: '' },
          { key: 'Storage', value: '' },
        ];
      case 'COMMUNICATION':
        return [
          { key: 'Frequency Range', value: '' },
          { key: 'Channels', value: '' },
        ];
      default:
        return [];
    }
  };

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([]);

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
    setErrorMessage(null);

    if (!formData.name || !formData.serialNumber) {
      setErrorMessage('Asset name and serial number are mandatory for custody tracking.');
      return;
    }

    setIsLoading(true);
    try {
      const specificationsObject: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specificationsObject[s.key.trim()] = s.value.trim();
        }
      });

      const newAsset = await createAssetApi({
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

      showToast('Asset Intaked', `Asset ${newAsset.assetCode} registered successfully.`, 'success');
      navigate(`/assets/${newAsset.id}`);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setErrorMessage(errorObj.message || 'Failed to register asset intake.');
      showToast('Intake Failed', errorObj.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', href: '/dashboard' },
              { label: 'Assets', href: '/assets' },
              { label: 'Intake New Asset' },
            ]}
          />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Asset Intake Registration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register serialized equipment or vehicle into the central police asset ledger.
          </p>
        </div>

        <Link
          to="/assets"
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
        {/* Section 1: Identification */}
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-100">
            Primary Identification & Nomenclature
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Asset Name / Nomenclature <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Glock 19 Gen 5 Duty Pistol"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Asset Tag Code (System Generated)
              </label>
              <input
                type="text"
                required
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-blue-700 font-mono font-medium focus:outline-none focus:border-blue-600"
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
                placeholder="BKX-88219"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Asset Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value as AssetCategory;
                  setFormData({ ...formData, category: newCat });
                  setSpecs(getCategoryDefaults(newCat));
                }}
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
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Glock Ges.m.b.H."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Model / Trim Designation
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="19 Gen 5 MOS"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operational Location & Status */}
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-100">
            Initial Disposition & Station
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Initial Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="AVAILABLE">AVAILABLE (Armory Storage)</option>
                <option value="ASSIGNED">ASSIGNED (In Custody)</option>
                <option value="MAINTENANCE">MAINTENANCE (Under Inspection)</option>
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
                <option value="EXCELLENT">EXCELLENT (New in Box)</option>
                <option value="GOOD">GOOD (Operational)</option>
                <option value="FAIR">FAIR (Cosmetic Wear)</option>
                <option value="POOR">POOR (Requires Service)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Station / Armory Location <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.currentLocation}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                placeholder="Precinct 1 Armory - Safe 2"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Procurement */}
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono pb-2 border-b border-slate-100">
            Procurement & Warranty Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Acquisition Date
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Unit Purchase Cost ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                placeholder="580.00"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Technical Attributes */}
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
                  placeholder="Attribute (e.g. Barrel Length, VIN)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 4.02 in, 1080p60)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  aria-label="Remove spec"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Protocol & Notes */}
        <div className="p-5 rounded-md border border-slate-200 bg-white shadow-2xs space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            Operational Protocol & Armory Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special storage requirements, armory check instructions, serial markings..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            to="/assets"
            className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Registering Intake...' : 'Submit Asset Registration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
