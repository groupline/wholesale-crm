'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Mail, MessageSquare, Send, Plus, X, Edit, Trash2, Copy, Play, Pause } from 'lucide-react';

type TabType = 'email-templates' | 'sms-templates' | 'broadcasts' | 'drip-campaigns';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  category: string;
  message: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('email-templates');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const supabase = createClient();

  const tabs = [
    { id: 'email-templates', name: 'Email Templates', icon: Mail, count: emailTemplates.length },
    { id: 'sms-templates', name: 'SMS Templates', icon: MessageSquare, count: smsTemplates.length },
    { id: 'broadcasts', name: 'Broadcasts', icon: Send, count: 0 },
    { id: 'drip-campaigns', name: 'Drip Campaigns', icon: Play, count: 0 }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const [emailData, smsData] = await Promise.all([
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('sms_templates').select('*').order('created_at', { ascending: false })
      ]);

      if (emailData.data) setEmailTemplates(emailData.data);
      if (smsData.data) setSMSTemplates(smsData.data);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Failed to load templates. Make sure to run communications-schema.sql in Supabase first.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Communications Center</h1>
        <p className="mt-2 text-gray-600">Manage email & SMS templates, broadcasts, and drip campaigns</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'email-templates' && (
        <EmailTemplatesTab
          templates={emailTemplates}
          loading={loading}
          onRefresh={loadTemplates}
        />
      )}
      {activeTab === 'sms-templates' && (
        <SMSTemplatesTab
          templates={smsTemplates}
          loading={loading}
          onRefresh={loadTemplates}
        />
      )}
      {activeTab === 'broadcasts' && <BroadcastsTab />}
      {activeTab === 'drip-campaigns' && <DripCampaignsTab />}
    </div>
  );
}

// Email Templates Tab
function EmailTemplatesTab({ templates, loading, onRefresh }: { templates: EmailTemplate[], loading: boolean, onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    subject: '',
    body: '',
    is_active: true
  });

  const supabase = createClient();

  const categories = [
    { value: 'seller_followup', label: 'Seller Follow-up' },
    { value: 'investor_broadcast', label: 'Investor Broadcast' },
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'general', label: 'General' }
  ];

  const availableVariables = [
    '{seller_name}', '{investor_name}', '{property_address}', '{bedrooms}', '{bathrooms}',
    '{asking_price}', '{offer_amount}', '{arv}', '{repair_estimate}',
    '{your_name}', '{company_name}', '{your_phone}', '{your_email}'
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(formData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        alert('Template updated!');
      } else {
        const { error } = await supabase.from('email_templates').insert([formData]);
        if (error) throw error;
        alert('Template created!');
      }

      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      onRefresh();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`Failed to save: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      alert('Template deleted!');
      onRefresh();
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  }

  function openEditModal(template: EmailTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      category: 'general',
      subject: '',
      body: '',
      is_active: true
    });
  }

  function insertVariable(variable: string) {
    setFormData({
      ...formData,
      body: formData.body + ' ' + variable
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Create reusable email templates with variable placeholders
        </p>
        <button
          onClick={() => { setEditingTemplate(null); resetForm(); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Email Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Email Templates</h2>
          <p className="text-gray-600 mb-6">Create your first template to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {template.category.replace('_', ' ')}
                    </span>
                    {!template.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Subject: {template.subject}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(template)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {template.variables && template.variables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {variable}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Email Template' : 'New Email Template'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingTemplate(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Seller Follow-up #1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Following up on {property_address}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body *</label>
                <textarea
                  required
                  rows={10}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Hi {seller_name},&#10;&#10;I wanted to follow up..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables (click to insert)</label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Template is active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTemplate(null); }}
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

// SMS Templates Tab
function SMSTemplatesTab({ templates, loading, onRefresh }: { templates: SMSTemplate[], loading: boolean, onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    message: '',
    is_active: true
  });

  const supabase = createClient();

  const categories = [
    { value: 'seller_followup', label: 'Seller Follow-up' },
    { value: 'investor_broadcast', label: 'Investor Broadcast' },
    { value: 'appointment_reminder', label: 'Appointment Reminder' },
    { value: 'general', label: 'General' }
  ];

  const availableVariables = [
    '{seller_name}', '{investor_name}', '{property_address}', '{bedrooms}', '{bathrooms}',
    '{asking_price}', '{arv}', '{your_name}', '{your_phone}', '{appointment_date}', '{appointment_time}'
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.message.length > 160) {
      if (!confirm('Message is longer than 160 characters and will be sent as multiple SMS. Continue?')) {
        return;
      }
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('sms_templates')
          .update(formData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        alert('Template updated!');
      } else {
        const { error } = await supabase.from('sms_templates').insert([formData]);
        if (error) throw error;
        alert('Template created!');
      }

      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      onRefresh();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`Failed to save: ${error.message}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase.from('sms_templates').delete().eq('id', id);
      if (error) throw error;
      alert('Template deleted!');
      onRefresh();
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  }

  function openEditModal(template: SMSTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.message,
      is_active: template.is_active
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      category: 'general',
      message: '',
      is_active: true
    });
  }

  function insertVariable(variable: string) {
    setFormData({
      ...formData,
      message: formData.message + ' ' + variable
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Create reusable SMS templates (keep under 160 characters for single SMS)
        </p>
        <button
          onClick={() => { setEditingTemplate(null); resetForm(); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          New SMS Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No SMS Templates</h2>
          <p className="text-gray-600 mb-6">Create your first SMS template</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      {template.category.replace('_', ' ')}
                    </span>
                    {!template.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 font-mono">{template.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {template.message.length} characters {template.message.length > 160 && '(multiple SMS)'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(template)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit SMS Template' : 'New SMS Template'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingTemplate(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Quick Follow-up"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Message *</label>
                  <span className={`text-sm ${formData.message.length > 160 ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                    {formData.message.length} / 160 characters
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="Hi {seller_name}, following up on {property_address}..."
                />
                {formData.message.length > 160 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Message will be sent as multiple SMS ({Math.ceil(formData.message.length / 160)} segments)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables (click to insert)</label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label className="ml-2 text-sm text-gray-700">Template is active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTemplate(null); }}
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

// Broadcasts Tab (Placeholder)
function BroadcastsTab() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Broadcasts</h2>
      <p className="text-gray-600 mb-4">
        Send mass emails to your investor list or seller leads
      </p>
      <p className="text-sm text-gray-500">
        Feature coming soon - use templates for now and send via your email provider
      </p>
    </div>
  );
}

// Drip Campaigns Tab (Placeholder)
function DripCampaignsTab() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Automated Drip Campaigns</h2>
      <p className="text-gray-600 mb-4">
        Create multi-step email/SMS sequences that trigger automatically
      </p>
      <p className="text-sm text-gray-500">
        Feature coming soon - manually send templates for now
      </p>
    </div>
  );
}
