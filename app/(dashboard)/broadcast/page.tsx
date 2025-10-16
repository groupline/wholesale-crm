'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Send, Users, Home, Target, CheckCircle, AlertCircle, Filter, Mail, MessageSquare } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  asking_price: number;
  arv: number;
  estimated_repairs: number;
}

interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  investor_type: string[];
  preferred_property_types: string[];
  min_budget: number;
  max_budget: number;
  status: string;
  matchScore?: number;
}

export default function BroadcastPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [matchedInvestors, setMatchedInvestors] = useState<Investor[]>([]);
  const [selectedInvestors, setSelectedInvestors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [broadcastType, setBroadcastType] = useState<'email' | 'sms'>('email');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [propertiesRes, investorsRes] = await Promise.all([
        supabase.from('properties').select('*').in('status', ['lead', 'evaluating', 'offer_made']).order('created_at', { ascending: false }),
        supabase.from('investors').select('*').eq('status', 'active').order('name')
      ]);

      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (investorsRes.data) setInvestors(investorsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function matchInvestorsToProperty(property: Property) {
    const matched = investors.map(investor => {
      let score = 0;
      const maxScore = 100;

      // Budget match (40 points)
      if (property.asking_price >= investor.min_budget && property.asking_price <= investor.max_budget) {
        score += 40;
      } else if (property.asking_price < investor.min_budget) {
        // Partial credit if close to budget
        const diff = investor.min_budget - property.asking_price;
        if (diff < investor.min_budget * 0.2) score += 20;
      } else if (property.asking_price > investor.max_budget) {
        const diff = property.asking_price - investor.max_budget;
        if (diff < investor.max_budget * 0.2) score += 20;
      }

      // Property type match (30 points)
      if (investor.preferred_property_types && investor.preferred_property_types.includes(property.property_type)) {
        score += 30;
      }

      // Investor type relevance (30 points)
      // All investor types are potentially interested, so give partial credit
      if (investor.investor_type && investor.investor_type.length > 0) {
        score += 30;
      }

      return { ...investor, matchScore: score };
    })
    .filter(inv => inv.matchScore! > 0)
    .sort((a, b) => b.matchScore! - a.matchScore!);

    setMatchedInvestors(matched);
    setSelectedInvestors(new Set(matched.filter(inv => inv.matchScore! >= 60).map(inv => inv.id)));
  }

  function handlePropertySelect(property: Property) {
    setSelectedProperty(property);
    matchInvestorsToProperty(property);

    // Generate default message
    const defaultMessage = broadcastType === 'email'
      ? `New Investment Opportunity: ${property.address}

Property Details:
📍 Address: ${property.address}, ${property.city || ''}
🛏️ Bedrooms: ${property.bedrooms || 'N/A'}
🛁 Bathrooms: ${property.bathrooms || 'N/A'}
🏠 Type: ${property.property_type || 'N/A'}
💰 Asking Price: $${property.asking_price?.toLocaleString() || 'N/A'}
📊 ARV: $${property.arv?.toLocaleString() || 'N/A'}
🔧 Est. Repairs: $${property.estimated_repairs?.toLocaleString() || 'N/A'}

This is a great opportunity! Reply to this email or call me if you're interested.

Best regards,
Your Name
Your Company
Your Phone`
      : `🏠 New Deal! ${property.bedrooms}bd/${property.bathrooms}ba at ${property.address} - $${property.asking_price?.toLocaleString()}. ARV $${property.arv?.toLocaleString()}. Interested? Call me!`;

    setMessage(defaultMessage);
  }

  function toggleInvestorSelection(investorId: string) {
    const newSelection = new Set(selectedInvestors);
    if (newSelection.has(investorId)) {
      newSelection.delete(investorId);
    } else {
      newSelection.add(investorId);
    }
    setSelectedInvestors(newSelection);
  }

  function selectAll() {
    setSelectedInvestors(new Set(matchedInvestors.map(inv => inv.id)));
  }

  function deselectAll() {
    setSelectedInvestors(new Set());
  }

  function getMatchColor(score: number) {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  }

  function handleBroadcast() {
    const selectedCount = selectedInvestors.size;

    if (selectedCount === 0) {
      alert('Please select at least one investor');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    // In a real implementation, this would send emails/SMS via API
    alert(`Broadcasting via ${broadcastType.toUpperCase()} to ${selectedCount} investor(s)!\n\nIn production, this would integrate with:\n- Email: SendGrid, Resend, or AWS SES\n- SMS: Twilio or similar service\n\nFor now, this is a preview of the functionality.`);

    // Log activity for each selected investor
    const selectedInvestorsList = matchedInvestors.filter(inv => selectedInvestors.has(inv.id));

    selectedInvestorsList.forEach(async (investor) => {
      await supabase.from('activities').insert([{
        activity_type: broadcastType,
        description: `Broadcast sent about ${selectedProperty?.address}: ${message.substring(0, 200)}...`,
        related_to_type: 'investor',
        related_to_id: investor.id,
        created_by: 'System'
      }]);
    });

    alert('Activities logged successfully!');
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investor Property Broadcast</h1>
        <p className="mt-2 text-gray-600">Match properties with investors and broadcast deals</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Property Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-green-600" />
              Select Property
            </h2>

            {properties.length === 0 ? (
              <p className="text-sm text-gray-500">No active properties available</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {properties.map(property => (
                  <button
                    key={property.id}
                    onClick={() => handlePropertySelect(property)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition ${
                      selectedProperty?.id === property.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm mb-1">{property.address}</div>
                    <div className="text-xs text-gray-600">
                      {property.bedrooms}bd / {property.bathrooms}ba
                    </div>
                    <div className="text-xs font-semibold text-green-600 mt-1">
                      ${property.asking_price?.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Matched Investors & Broadcast */}
        <div className="lg:col-span-2">
          {!selectedProperty ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Property</h2>
              <p className="text-gray-600">Choose a property to see matched investors</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Matched Investors List */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Matched Investors ({matchedInvestors.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {matchedInvestors.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No investors match this property criteria</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {matchedInvestors.map(investor => (
                      <div
                        key={investor.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedInvestors.has(investor.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleInvestorSelection(investor.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={selectedInvestors.has(investor.id)}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="font-semibold text-gray-900">{investor.name}</span>
                            </div>
                            <div className="text-xs text-gray-600 ml-6">
                              {investor.email} {investor.phone && `• ${investor.phone}`}
                            </div>
                            <div className="text-xs text-gray-500 ml-6 mt-1">
                              Budget: ${investor.min_budget?.toLocaleString()} - ${investor.max_budget?.toLocaleString()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getMatchColor(investor.matchScore!)}`}>
                              {investor.matchScore}% Match
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Broadcast Message */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2 text-purple-600" />
                  Broadcast Message
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broadcast Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBroadcastType('email')}
                        className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg transition ${
                          broadcastType === 'email'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Email
                      </button>
                      <button
                        onClick={() => setBroadcastType('sms')}
                        className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg transition ${
                          broadcastType === 'sms'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        SMS
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message {broadcastType === 'sms' && `(${message.length}/160 chars)`}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={broadcastType === 'email' ? 12 : 4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder={`Enter your ${broadcastType} message...`}
                    />
                    {broadcastType === 'sms' && message.length > 160 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Message will be sent as {Math.ceil(message.length / 160)} SMS segments
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          {selectedInvestors.size} investor(s) selected
                        </span>
                      </div>
                      <button
                        onClick={handleBroadcast}
                        disabled={selectedInvestors.size === 0}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Broadcast
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                    <p className="font-semibold mb-1">💡 Integration Note:</p>
                    <p>
                      For production use, integrate with email services (SendGrid, Resend, AWS SES) or SMS providers (Twilio).
                      This demo logs activities and shows the broadcast preview.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
