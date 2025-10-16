'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { TrendingUp, Plus, Pencil, Trash2, X, DollarSign, Calendar } from 'lucide-react';

interface Deal {
  id: string;
  property_id: string | null;
  investor_id: string | null;
  deal_type: string | null;
  purchase_price: number | null;
  sale_price: number | null;
  assignment_fee: number | null;
  contract_date: string | null;
  closing_date: string | null;
  actual_close_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
}

interface Investor {
  id: string;
  first_name: string;
  last_name: string;
}

type DealFormData = Omit<Deal, 'id' | 'created_at'>;

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({
    property_id: null,
    investor_id: null,
    deal_type: '',
    purchase_price: null,
    sale_price: null,
    assignment_fee: null,
    contract_date: null,
    closing_date: null,
    actual_close_date: null,
    status: 'pending',
    notes: ''
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dealsRes, propertiesRes, investorsRes] = await Promise.all([
        supabase.from('deals').select('*').order('created_at', { ascending: false }),
        supabase.from('properties').select('id, address, city, state').order('address'),
        supabase.from('investors').select('id, first_name, last_name').order('first_name')
      ]);

      if (dealsRes.error) throw dealsRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (investorsRes.error) throw investorsRes.error;

      setDeals(dealsRes.data || []);
      setProperties(propertiesRes.data || []);
      setInvestors(investorsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingDeal) {
        const { error } = await supabase
          .from('deals')
          .update(formData)
          .eq('id', editingDeal.id);
        if (error) throw error;
        alert('Deal updated successfully!');
      } else {
        const { error } = await supabase.from('deals').insert([formData]);
        if (error) throw error;
        alert('Deal added successfully!');
      }

      setShowModal(false);
      setEditingDeal(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving deal:', error);
      alert(`Failed to save deal: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
      alert('Deal deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      alert(`Failed to delete deal: ${error.message}`);
    }
  }

  function openAddModal() {
    setEditingDeal(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(deal: Deal) {
    setEditingDeal(deal);
    setFormData({
      property_id: deal.property_id,
      investor_id: deal.investor_id,
      deal_type: deal.deal_type || '',
      purchase_price: deal.purchase_price,
      sale_price: deal.sale_price,
      assignment_fee: deal.assignment_fee,
      contract_date: deal.contract_date,
      closing_date: deal.closing_date,
      actual_close_date: deal.actual_close_date,
      status: deal.status,
      notes: deal.notes || ''
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      property_id: null,
      investor_id: null,
      deal_type: '',
      purchase_price: null,
      sale_price: null,
      assignment_fee: null,
      contract_date: null,
      closing_date: null,
      actual_close_date: null,
      status: 'pending',
      notes: ''
    });
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_contract: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getPropertyName(propertyId: string | null) {
    if (!propertyId) return '-';
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.address}, ${property.city}, ${property.state}` : '-';
  }

  function getInvestorName(investorId: string | null) {
    if (!investorId) return '-';
    const investor = investors.find(i => i.id === investorId);
    return investor ? `${investor.first_name} ${investor.last_name}` : '-';
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="mt-2 text-gray-600">Manage your deal pipeline</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Deal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Deals Yet</h2>
          <p className="text-gray-600 mb-6">Start tracking your deals</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deal.status)}`}>
                  {deal.status.replace('_', ' ')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(deal)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Property</div>
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {getPropertyName(deal.property_id)}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Investor</div>
                <div className="text-sm text-gray-700">
                  {getInvestorName(deal.investor_id)}
                </div>
              </div>

              {deal.deal_type && (
                <div className="text-sm text-gray-600 mb-3">
                  Type: <span className="font-medium">{deal.deal_type}</span>
                </div>
              )}

              {deal.assignment_fee && (
                <div className="flex items-center text-green-600 font-semibold mb-3">
                  <DollarSign className="w-4 h-4" />
                  {deal.assignment_fee.toLocaleString()} assignment fee
                </div>
              )}

              {deal.closing_date && (
                <div className="flex items-center text-sm text-gray-500 pt-3 border-t">
                  <Calendar className="w-4 h-4 mr-2" />
                  Close: {new Date(deal.closing_date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDeal ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingDeal(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Property & Investor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                  <select
                    value={formData.property_id || ''}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.address}, {property.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investor</label>
                  <select
                    value={formData.investor_id || ''}
                    onChange={(e) => setFormData({ ...formData, investor_id: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select investor</option>
                    {investors.map(investor => (
                      <option key={investor.id} value={investor.id}>
                        {investor.first_name} {investor.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Deal Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
                  <select
                    value={formData.deal_type || ''}
                    onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="double-close">Double Close</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_contract">Under Contract</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                    <input
                      type="number"
                      placeholder="$100,000"
                      value={formData.purchase_price || ''}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price</label>
                    <input
                      type="number"
                      placeholder="$120,000"
                      value={formData.sale_price || ''}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Fee</label>
                    <input
                      type="number"
                      placeholder="$20,000"
                      value={formData.assignment_fee || ''}
                      onChange={(e) => setFormData({ ...formData, assignment_fee: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Important Dates</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Date</label>
                    <input
                      type="date"
                      value={formData.contract_date || ''}
                      onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Date</label>
                    <input
                      type="date"
                      value={formData.closing_date || ''}
                      onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actual Close Date</label>
                    <input
                      type="date"
                      value={formData.actual_close_date || ''}
                      onChange={(e) => setFormData({ ...formData, actual_close_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Deal notes, special conditions, etc..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingDeal ? 'Update Deal' : 'Add Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingDeal(null); }}
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
