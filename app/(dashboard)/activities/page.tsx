'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Phone, Mail, MessageSquare, Users, Calendar, FileText, Plus, X, Filter } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  related_to_type: string | null;
  related_to_id: string | null;
  created_by: string | null;
  created_at: string;
  related_entity_name?: string;
}

type ActivityFormData = Omit<Activity, 'id' | 'created_at' | 'related_entity_name'>;

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  // For entity selection
  const [sellers, setSellers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const [formData, setFormData] = useState<ActivityFormData>({
    activity_type: 'note',
    description: '',
    related_to_type: null,
    related_to_id: null,
    created_by: ''
  });

  const supabase = createClient();

  const activityTypes = [
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-blue-100 text-blue-800' },
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-green-100 text-green-800' },
    { value: 'text', label: 'Text/SMS', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
    { value: 'meeting', label: 'Meeting', icon: Users, color: 'bg-orange-100 text-orange-800' },
    { value: 'note', label: 'Note', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'status_change', label: 'Status Change', icon: Calendar, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const entityTypes = [
    { value: 'seller', label: 'Seller' },
    { value: 'property', label: 'Property' },
    { value: 'investor', label: 'Investor' },
    { value: 'deal', label: 'Deal' }
  ];

  useEffect(() => {
    loadActivities();
    loadEntities();
  }, []);

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich activities with related entity names
      const enrichedActivities = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.related_to_type && activity.related_to_id) {
            try {
              const tableName = activity.related_to_type === 'seller' ? 'sellers' :
                               activity.related_to_type === 'property' ? 'properties' :
                               activity.related_to_type === 'investor' ? 'investors' : 'deals';

              const { data: related } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', activity.related_to_id)
                .single();

              if (related) {
                const name = related.name || related.address || 'Unknown';
                return { ...activity, related_entity_name: name };
              }
            } catch (err) {
              console.error('Error fetching related entity:', err);
            }
          }
          return activity;
        })
      );

      setActivities(enrichedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      alert('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }

  async function loadEntities() {
    try {
      const [sellersData, propertiesData, investorsData, dealsData] = await Promise.all([
        supabase.from('sellers').select('id, name').order('name'),
        supabase.from('properties').select('id, address').order('address'),
        supabase.from('investors').select('id, name').order('name'),
        supabase.from('deals').select('id, property_id, investor_id').order('created_at', { ascending: false })
      ]);

      if (sellersData.data) setSellers(sellersData.data);
      if (propertiesData.data) setProperties(propertiesData.data);
      if (investorsData.data) setInvestors(investorsData.data);
      if (dealsData.data) setDeals(dealsData.data);
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase.from('activities').insert([formData]);
      if (error) throw error;

      alert('Activity logged successfully!');
      setShowModal(false);
      resetForm();
      loadActivities();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      alert(`Failed to save activity: ${error.message}`);
    }
  }

  function resetForm() {
    setFormData({
      activity_type: 'note',
      description: '',
      related_to_type: null,
      related_to_id: null,
      created_by: ''
    });
  }

  function getActivityTypeInfo(type: string) {
    return activityTypes.find(t => t.value === type) || activityTypes[4]; // Default to 'note'
  }

  function getRelatedEntities() {
    switch (formData.related_to_type) {
      case 'seller':
        return sellers;
      case 'property':
        return properties;
      case 'investor':
        return investors;
      case 'deal':
        return deals;
      default:
        return [];
    }
  }

  const filteredActivities = activities.filter(activity => {
    const typeMatch = filterType === 'all' || activity.activity_type === filterType;
    const entityMatch = filterEntity === 'all' || activity.related_to_type === filterEntity;
    return typeMatch && entityMatch;
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities & Communication Log</h1>
          <p className="mt-2 text-gray-600">Track all interactions with sellers, investors, and deals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Activity
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>

        {/* Activity Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Types</option>
          {activityTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Entity Type Filter */}
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Entities</option>
          {entityTypes.map(entity => (
            <option key={entity.value} value={entity.value}>{entity.label}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500">
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Activities Found</h2>
          <p className="text-gray-600 mb-6">
            {activities.length === 0
              ? 'Start logging your communications and activities'
              : 'No activities match your filters'
            }
          </p>
          {activities.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Your First Activity
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Timeline View */}
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {filteredActivities.map((activity, idx) => {
                  const typeInfo = getActivityTypeInfo(activity.activity_type);
                  const Icon = typeInfo.icon;
                  const isLast = idx === filteredActivities.length - 1;

                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          {/* Icon */}
                          <div>
                            <div className={`relative px-1 h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${typeInfo.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                {activity.related_to_type && (
                                  <span className="text-xs text-gray-500">
                                    → {activity.related_to_type.charAt(0).toUpperCase() + activity.related_to_type.slice(1)}
                                    {activity.related_entity_name && `: ${activity.related_entity_name}`}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">{activity.description}</p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                <span>{new Date(activity.created_at).toLocaleString()}</span>
                                {activity.created_by && (
                                  <span>By: {activity.created_by}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Log Activity</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activityTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, activity_type: type.value })}
                        className={`flex items-center p-3 border-2 rounded-lg transition ${
                          formData.activity_type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-2 text-gray-600" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the activity or conversation..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related To (Optional)
                  </label>
                  <select
                    value={formData.related_to_type || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      related_to_type: e.target.value || null,
                      related_to_id: null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {entityTypes.map(entity => (
                      <option key={entity.value} value={entity.value}>{entity.label}</option>
                    ))}
                  </select>
                </div>

                {formData.related_to_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select {formData.related_to_type.charAt(0).toUpperCase() + formData.related_to_type.slice(1)}
                    </label>
                    <select
                      value={formData.related_to_id || ''}
                      onChange={(e) => setFormData({ ...formData, related_to_id: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      {getRelatedEntities().map((entity: any) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name || entity.address || `Deal #${entity.id.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By (Optional)
                </label>
                <input
                  type="text"
                  value={formData.created_by || ''}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name or team member name"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Log Activity
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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
