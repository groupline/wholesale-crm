'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Home, Plus, Pencil, Trash2, MapPin, DollarSign, X } from 'lucide-react';

interface Property {
  id: string;
  seller_id: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  condition: string | null;
  estimated_value: number | null;
  asking_price: number | null;
  our_offer: number | null;
  arv: number | null;
  repair_costs: number | null;
  description: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Seller {
  id: string;
  first_name: string;
  last_name: string;
}

type PropertyFormData = Omit<Property, 'id' | 'created_at'>;

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    seller_id: null,
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: '',
    bedrooms: null,
    bathrooms: null,
    square_feet: null,
    year_built: null,
    condition: '',
    estimated_value: null,
    asking_price: null,
    our_offer: null,
    arv: null,
    repair_costs: null,
    description: '',
    notes: '',
    status: 'lead'
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [propertiesRes, sellersRes] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('sellers').select('id, first_name, last_name').order('first_name')
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (sellersRes.error) throw sellersRes.error;

      setProperties(propertiesRes.data || []);
      setSellers(sellersRes.data || []);
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
      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(formData)
          .eq('id', editingProperty.id);
        if (error) throw error;
        alert('Property updated successfully!');
      } else {
        const { error } = await supabase.from('properties').insert([formData]);
        if (error) throw error;
        alert('Property added successfully!');
      }

      setShowModal(false);
      setEditingProperty(null);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error saving property:', error);
      alert(`Failed to save property: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      alert('Property deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      alert(`Failed to delete property: ${error.message}`);
    }
  }

  function openAddModal() {
    setEditingProperty(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(property: Property) {
    setEditingProperty(property);
    setFormData({
      seller_id: property.seller_id,
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      property_type: property.property_type || '',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      year_built: property.year_built,
      condition: property.condition || '',
      estimated_value: property.estimated_value,
      asking_price: property.asking_price,
      our_offer: property.our_offer,
      arv: property.arv,
      repair_costs: property.repair_costs,
      description: property.description || '',
      notes: property.notes || '',
      status: property.status
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      seller_id: null,
      address: '',
      city: '',
      state: '',
      zip_code: '',
      property_type: '',
      bedrooms: null,
      bathrooms: null,
      square_feet: null,
      year_built: null,
      condition: '',
      estimated_value: null,
      asking_price: null,
      our_offer: null,
      arv: null,
      repair_costs: null,
      description: '',
      notes: '',
      status: 'lead'
    });
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800',
      evaluating: 'bg-yellow-100 text-yellow-800',
      offer_made: 'bg-orange-100 text-orange-800',
      under_contract: 'bg-indigo-100 text-indigo-800',
      purchased: 'bg-purple-100 text-purple-800',
      wholesaled: 'bg-green-100 text-green-800',
      closed: 'bg-emerald-100 text-emerald-800',
      dead: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getSellerName(sellerId: string | null) {
    if (!sellerId) return '-';
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? `${seller.first_name} ${seller.last_name}` : '-';
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="mt-2 text-gray-600">Manage your property inventory</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Property
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h2>
          <p className="text-gray-600 mb-6">Start by adding your first property</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                  {property.status.replace('_', ' ')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(property)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-start text-gray-900 font-semibold mb-1">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 text-gray-400" />
                  {property.address}
                </div>
                <div className="text-sm text-gray-600 ml-5">
                  {property.city}, {property.state} {property.zip_code}
                </div>
              </div>

              {property.property_type && (
                <div className="text-sm text-gray-600 mb-2">
                  {property.property_type} • {property.bedrooms || 0} bed • {property.bathrooms || 0} bath
                </div>
              )}

              {property.asking_price && (
                <div className="flex items-center text-green-600 font-semibold mb-2">
                  <DollarSign className="w-4 h-4" />
                  {property.asking_price.toLocaleString()}
                </div>
              )}

              <div className="text-xs text-gray-500 pt-3 border-t">
                Seller: {getSellerName(property.seller_id)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingProperty(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Seller Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller</label>
                <select
                  value={formData.seller_id || ''}
                  onChange={(e) => setFormData({ ...formData, seller_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a seller (optional)</option>
                  {sellers.map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.first_name} {seller.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Address</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="Street Address *"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="City *"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State *"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="ZIP *"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.property_type || ''}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Property Type</option>
                    <option value="single-family">Single Family</option>
                    <option value="multi-family">Multi Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                  </select>
                  <select
                    value={formData.condition || ''}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Condition</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Bedrooms"
                    value={formData.bedrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Bathrooms"
                    value={formData.bathrooms || ''}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Square Feet"
                    value={formData.square_feet || ''}
                    onChange={(e) => setFormData({ ...formData, square_feet: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Year Built"
                    value={formData.year_built || ''}
                    onChange={(e) => setFormData({ ...formData, year_built: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Estimated Value"
                    value={formData.estimated_value || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Asking Price"
                    value={formData.asking_price || ''}
                    onChange={(e) => setFormData({ ...formData, asking_price: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Our Offer"
                    value={formData.our_offer || ''}
                    onChange={(e) => setFormData({ ...formData, our_offer: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="ARV (After Repair Value)"
                    value={formData.arv || ''}
                    onChange={(e) => setFormData({ ...formData, arv: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Repair Costs"
                    value={formData.repair_costs || ''}
                    onChange={(e) => setFormData({ ...formData, repair_costs: e.target.value ? Number(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
                  <option value="lead">Lead</option>
                  <option value="evaluating">Evaluating</option>
                  <option value="offer_made">Offer Made</option>
                  <option value="under_contract">Under Contract</option>
                  <option value="purchased">Purchased</option>
                  <option value="wholesaled">Wholesaled</option>
                  <option value="closed">Closed</option>
                  <option value="dead">Dead</option>
                </select>
              </div>

              {/* Description & Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Property description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingProperty ? 'Update Property' : 'Add Property'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingProperty(null); }}
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
