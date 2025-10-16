'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { TrendingUp, Plus, X, Edit, Trash2, DollarSign, Users, Target, BarChart3 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  budget: number;
  actual_spent: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  lead_count?: number;
  converted_count?: number;
  revenue?: number;
}

type CampaignFormData = Omit<Campaign, 'id' | 'created_at' | 'lead_count' | 'converted_count' | 'revenue'>;

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    channel: 'direct_mail',
    budget: 0,
    actual_spent: 0,
    start_date: null,
    end_date: null,
    status: 'active',
    notes: ''
  });

  const supabase = createClient();

  const channels = [
    { value: 'direct_mail', label: 'Direct Mail', icon: '📬' },
    { value: 'ppc', label: 'PPC (Google/Facebook Ads)', icon: '💻' },
    { value: 'cold_calling', label: 'Cold Calling', icon: '📞' },
    { value: 'bandit_signs', label: 'Bandit Signs', icon: '🪧' },
    { value: 'seo', label: 'SEO / Organic', icon: '🔍' },
    { value: 'social_media', label: 'Social Media', icon: '📱' },
    { value: 'referral', label: 'Referral', icon: '🤝' },
    { value: 'networking', label: 'Networking Events', icon: '👥' },
    { value: 'wholesaler_list', label: 'Wholesaler List', icon: '📋' },
    { value: 'for_sale_by_owner', label: 'For Sale By Owner (FSBO)', icon: '🏠' },
    { value: 'expired_listings', label: 'Expired Listings', icon: '⏰' },
    { value: 'pre_foreclosure', label: 'Pre-Foreclosure', icon: '⚠️' },
    { value: 'probate', label: 'Probate Leads', icon: '📜' },
    { value: 'driving_for_dollars', label: 'Driving for Dollars', icon: '🚗' },
    { value: 'other', label: 'Other', icon: '📎' }
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      // Get campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Enrich with metrics
      const enrichedCampaigns = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Count leads from this campaign
          const { count: leadCount } = await supabase
            .from('sellers')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          // Count converted leads (closed deals)
          const { data: convertedSellers } = await supabase
            .from('sellers')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('status', 'closed');

          // Calculate revenue from this campaign
          let revenue = 0;
          if (convertedSellers && convertedSellers.length > 0) {
            const sellerIds = convertedSellers.map(s => s.id);

            // Get properties from these sellers
            const { data: properties } = await supabase
              .from('properties')
              .select('id')
              .in('seller_id', sellerIds);

            if (properties && properties.length > 0) {
              const propertyIds = properties.map(p => p.id);

              // Get closed deals from these properties
              const { data: deals } = await supabase
                .from('deals')
                .select('assignment_fee')
                .in('property_id', propertyIds)
                .eq('status', 'closed');

              revenue = (deals || []).reduce((sum, deal) => sum + (deal.assignment_fee || 0), 0);
            }
          }

          return {
            ...campaign,
            lead_count: leadCount || 0,
            converted_count: convertedSellers?.length || 0,
            revenue
          };
        })
      );

      setCampaigns(enrichedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      alert('Failed to load campaigns. Make sure to run marketing-campaigns-schema.sql in Supabase first.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingCampaign) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .update(formData)
          .eq('id', editingCampaign.id);
        if (error) throw error;
        alert('Campaign updated successfully!');
      } else {
        const { error } = await supabase.from('marketing_campaigns').insert([formData]);
        if (error) throw error;
        alert('Campaign created successfully!');
      }

      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
      loadCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      alert(`Failed to save campaign: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this campaign? Sellers linked to it will not be deleted.')) return;

    try {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
      alert('Campaign deleted successfully!');
      loadCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      alert(`Failed to delete campaign: ${error.message}`);
    }
  }

  function openAddModal() {
    setEditingCampaign(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(campaign: Campaign) {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      channel: campaign.channel,
      budget: campaign.budget,
      actual_spent: campaign.actual_spent,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status,
      notes: campaign.notes || ''
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      channel: 'direct_mail',
      budget: 0,
      actual_spent: 0,
      start_date: null,
      end_date: null,
      status: 'active',
      notes: ''
    });
  }

  function calculateMetrics(campaign: Campaign) {
    const costPerLead = campaign.lead_count && campaign.lead_count > 0
      ? campaign.actual_spent / campaign.lead_count
      : 0;

    const conversionRate = campaign.lead_count && campaign.lead_count > 0
      ? (campaign.converted_count! / campaign.lead_count) * 100
      : 0;

    const roi = campaign.actual_spent > 0
      ? ((campaign.revenue! - campaign.actual_spent) / campaign.actual_spent) * 100
      : 0;

    return { costPerLead, conversionRate, roi };
  }

  function getChannelInfo(channelValue: string) {
    return channels.find(c => c.value === channelValue) || channels[channels.length - 1];
  }

  // Calculate totals
  const totals = campaigns.reduce((acc, campaign) => ({
    budget: acc.budget + campaign.budget,
    spent: acc.spent + campaign.actual_spent,
    leads: acc.leads + (campaign.lead_count || 0),
    conversions: acc.conversions + (campaign.converted_count || 0),
    revenue: acc.revenue + (campaign.revenue || 0)
  }), { budget: 0, spent: 0, leads: 0, conversions: 0, revenue: 0 });

  const overallROI = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0;
  const avgCostPerLead = totals.leads > 0 ? totals.spent / totals.leads : 0;
  const overallConversionRate = totals.leads > 0 ? (totals.conversions / totals.leads) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing ROI Tracker</h1>
          <p className="mt-2 text-gray-600">Track campaign performance and marketing spend</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${totals.budget.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${totals.spent.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{totals.leads}</p>
              <p className="text-xs text-gray-500">${avgCostPerLead.toFixed(2)}/lead</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{overallConversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{totals.conversions} closed</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Overall ROI</p>
              <p className={`text-2xl font-bold ${overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overallROI.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">${totals.revenue.toLocaleString()} revenue</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Marketing Campaigns Yet</h2>
          <p className="text-gray-600 mb-6">Create your first campaign to start tracking ROI</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget / Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Leads</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/Lead</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const metrics = calculateMetrics(campaign);
                  const channelInfo = getChannelInfo(campaign.channel);

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-xs text-gray-500">
                            {campaign.start_date && new Date(campaign.start_date).toLocaleDateString()}
                            {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString()}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {channelInfo.icon} {channelInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="text-gray-900">${campaign.budget.toLocaleString()}</div>
                        <div className="text-gray-500">${campaign.actual_spent.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {campaign.lead_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        ${metrics.costPerLead.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`font-semibold ${metrics.conversionRate >= 5 ? 'text-green-600' : 'text-gray-600'}`}>
                          {metrics.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        ${campaign.revenue?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className={`font-bold ${metrics.roi >= 100 ? 'text-green-600' : metrics.roi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {metrics.roi.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openEditModal(campaign)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'New Marketing Campaign'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingCampaign(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Q1 Direct Mail Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Channel *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {channels.map(channel => (
                    <option key={channel.value} value={channel.value}>
                      {channel.icon} {channel.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Spent
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.actual_spent}
                      onChange={(e) => setFormData({ ...formData, actual_spent: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Campaign details, target audience, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCampaign(null); }}
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
