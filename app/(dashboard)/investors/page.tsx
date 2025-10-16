'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Briefcase, Plus, Pencil, Trash2, Phone, Mail, X, DollarSign } from 'lucide-react';

interface Investor {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  secondary_phone: string | null;
  company_name: string | null;
  investor_type: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  preferred_locations: string[] | null;
  preferred_property_types: string[] | null;
  needs_financing: boolean;
  proof_of_funds: boolean;
  experience_level: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

type InvestorFormData = Omit<Investor, 'id' | 'created_at'>;

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [formData, setFormData] = useState<InvestorFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    company_name: '',
    investor_type: [],
    min_budget: null,
    max_budget: null,
    preferred_locations: [],
    preferred_property_types: [],
    needs_financing: false,
    proof_of_funds: false,
    experience_level: '',
    notes: '',
    status: 'active'
  });

  const supabase = createClient();

  useEffect(() => {
    loadInvestors();
  }, []);

  async function loadInvestors() {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestors(data || []);
    } catch (error) {
      console.error('Error loading investors:', error);
      alert('Failed to load investors');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingInvestor) {
        const { error } = await supabase
          .from('investors')
          .update(formData)
          .eq('id', editingInvestor.id);
        if (error) throw error;
        alert('Investor updated successfully!');
      } else {
        const { error } = await supabase.from('investors').insert([formData]);
        if (error) throw error;
        alert('Investor added successfully!');
      }

      setShowModal(false);
      setEditingInvestor(null);
      resetForm();
      loadInvestors();
    } catch (error: any) {
      console.error('Error saving investor:', error);
      alert(`Failed to save investor: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this investor?')) return;

    try {
      const { error } = await supabase.from('investors').delete().eq('id', id);
      if (error) throw error;
      alert('Investor deleted successfully!');
      loadInvestors();
    } catch (error: any) {
      console.error('Error deleting investor:', error);
      alert(`Failed to delete investor: ${error.message}`);
    }
  }

  function openAddModal() {
    setEditingInvestor(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(investor: Investor) {
    setEditingInvestor(investor);
    setFormData({
      first_name: investor.first_name,
      last_name: investor.last_name,
      email: investor.email || '',
      phone: investor.phone,
      secondary_phone: investor.secondary_phone || '',
      company_name: investor.company_name || '',
      investor_type: investor.investor_type || [],
      min_budget: investor.min_budget,
      max_budget: investor.max_budget,
      preferred_locations: investor.preferred_locations || [],
      preferred_property_types: investor.preferred_property_types || [],
      needs_financing: investor.needs_financing,
      proof_of_funds: investor.proof_of_funds,
      experience_level: investor.experience_level || '',
      notes: investor.notes || '',
      status: investor.status
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      secondary_phone: '',
      company_name: '',
      investor_type: [],
      min_budget: null,
      max_budget: null,
      preferred_locations: [],
      preferred_property_types: [],
      needs_financing: false,
      proof_of_funds: false,
      experience_level: '',
      notes: '',
      status: 'active'
    });
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      do_not_contact: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function toggleArrayItem(array: string[], item: string) {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investors</h1>
          <p className="mt-2 text-gray-600">Manage your buyer list</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Investor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading investors...</p>
        </div>
      ) : investors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Investors Yet</h2>
          <p className="text-gray-600 mb-6">Start building your buyer list</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Investor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investors.map((investor) => (
                <tr key={investor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {investor.first_name} {investor.last_name}
                    </div>
                    {investor.company_name && (
                      <div className="text-sm text-gray-500">{investor.company_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {investor.phone}
                    </div>
                    {investor.email && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {investor.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {investor.min_budget || investor.max_budget ? (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {investor.min_budget?.toLocaleString() || '0'} - ${investor.max_budget?.toLocaleString() || '∞'}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {investor.investor_type && investor.investor_type.length > 0
                      ? investor.investor_type.join(', ')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(investor.status)}`}>
                      {investor.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(investor)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(investor.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingInvestor(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="First Name *"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Last Name *"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Secondary Phone"
                    value={formData.secondary_phone || ''}
                    onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Investment Criteria */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Investment Criteria</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investor Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['BRRRR', 'fix-and-flip', 'buy-and-hold', 'wholesale'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.investor_type?.includes(type) || false}
                          onChange={() => setFormData({
                            ...formData,
                            investor_type: toggleArrayItem(formData.investor_type || [], type)
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget</label>
                    <input
                      type="number"
                      placeholder="$50,000"
                      value={formData.min_budget || ''}
                      onChange={(e) => setFormData({ ...formData, min_budget: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                    <input
                      type="number"
                      placeholder="$500,000"
                      value={formData.max_budget || ''}
                      onChange={(e) => setFormData({ ...formData, max_budget: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Property Types</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['single-family', 'multi-family', 'condo', 'townhouse', 'land'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferred_property_types?.includes(type) || false}
                          onChange={() => setFormData({
                            ...formData,
                            preferred_property_types: toggleArrayItem(formData.preferred_property_types || [], type)
                          })}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={formData.experience_level || ''}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Financial Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Financial Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.needs_financing}
                      onChange={(e) => setFormData({ ...formData, needs_financing: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Needs Financing</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.proof_of_funds}
                      onChange={(e) => setFormData({ ...formData, proof_of_funds: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Has Proof of Funds</span>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="do_not_contact">Do Not Contact</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Investment preferences, special requirements, etc..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingInvestor ? 'Update Investor' : 'Add Investor'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingInvestor(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
