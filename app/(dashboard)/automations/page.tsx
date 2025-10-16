'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Zap, Plus, Edit2, Trash2, Play, Pause, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  entity_type: string;
  trigger_type: string;
  trigger_condition: any;
  action_type: string;
  action_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ExecutionLog {
  id: string;
  rule_id: string;
  entity_type: string | null;
  entity_id: string | null;
  executed_at: string;
  success: boolean;
  error_message: string | null;
  action_result: any;
  rule_name?: string;
}

export default function AutomationsPage() {
  const supabase = createClient();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executionLog, setExecutionLog] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: 'seller',
    trigger_type: 'status_change',
    trigger_field: 'status',
    trigger_to: '',
    action_type: 'create_task',
    action_title: '',
    action_description: '',
    action_priority: 'medium',
    action_due_days: 1,
    is_active: true
  });

  useEffect(() => {
    loadRules();
    loadExecutionLog();
  }, []);

  async function loadRules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('workflow_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading rules:', error);
    } else {
      setRules(data || []);
    }
    setLoading(false);
  }

  async function loadExecutionLog() {
    const { data, error } = await supabase
      .from('workflow_execution_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading execution log:', error);
    } else {
      // Enrich with rule names
      const enriched = await Promise.all(
        (data || []).map(async (log) => {
          const rule = rules.find(r => r.id === log.rule_id);
          return { ...log, rule_name: rule?.name || 'Unknown Rule' };
        })
      );
      setExecutionLog(enriched);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const triggerCondition = {
      field: formData.trigger_field,
      to: formData.trigger_to
    };

    const actionConfig = {
      title: formData.action_title,
      description: formData.action_description,
      priority: formData.action_priority,
      due_days: formData.action_due_days
    };

    const ruleData = {
      name: formData.name,
      description: formData.description,
      entity_type: formData.entity_type,
      trigger_type: formData.trigger_type,
      trigger_condition: triggerCondition,
      action_type: formData.action_type,
      action_config: actionConfig,
      is_active: formData.is_active
    };

    if (editingRule) {
      const { error } = await supabase
        .from('workflow_rules')
        .update(ruleData)
        .eq('id', editingRule.id);

      if (error) {
        alert('Error updating rule: ' + error.message);
      } else {
        alert('Rule updated successfully!');
        setShowModal(false);
        setEditingRule(null);
        loadRules();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('workflow_rules')
        .insert([ruleData]);

      if (error) {
        alert('Error creating rule: ' + error.message);
      } else {
        alert('Rule created successfully!');
        setShowModal(false);
        loadRules();
        resetForm();
      }
    }
  }

  async function toggleRuleStatus(rule: WorkflowRule) {
    const { error } = await supabase
      .from('workflow_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);

    if (error) {
      alert('Error toggling rule: ' + error.message);
    } else {
      loadRules();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workflow rule?')) return;

    const { error } = await supabase
      .from('workflow_rules')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting rule: ' + error.message);
    } else {
      loadRules();
    }
  }

  function openEditModal(rule: WorkflowRule) {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      entity_type: rule.entity_type,
      trigger_type: rule.trigger_type,
      trigger_field: rule.trigger_condition.field || 'status',
      trigger_to: rule.trigger_condition.to || '',
      action_type: rule.action_type,
      action_title: rule.action_config.title || '',
      action_description: rule.action_config.description || '',
      action_priority: rule.action_config.priority || 'medium',
      action_due_days: rule.action_config.due_days || 1,
      is_active: rule.is_active
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      entity_type: 'seller',
      trigger_type: 'status_change',
      trigger_field: 'status',
      trigger_to: '',
      action_type: 'create_task',
      action_title: '',
      action_description: '',
      action_priority: 'medium',
      action_due_days: 1,
      is_active: true
    });
  }

  function getEntityTypeBadge(type: string) {
    const colors: any = {
      seller: 'bg-blue-100 text-blue-800',
      property: 'bg-green-100 text-green-800',
      deal: 'bg-purple-100 text-purple-800',
      task: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  function getActionTypeBadge(type: string) {
    const colors: any = {
      create_task: 'bg-indigo-100 text-indigo-800',
      send_email: 'bg-yellow-100 text-yellow-800',
      send_sms: 'bg-pink-100 text-pink-800',
      log_activity: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automations</h1>
          <p className="text-gray-600 mt-1">Automate tasks and notifications based on status changes</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Workflow Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Execution Log ({executionLog.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading automations...</p>
        </div>
      ) : (
        <>
          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workflow Rules Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first automation rule to save time</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create First Rule
                  </button>
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeBadge(rule.entity_type)}`}>
                            {rule.entity_type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeBadge(rule.action_type)}`}>
                            {rule.action_type.replace('_', ' ')}
                          </span>
                          {rule.is_active ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-gray-600 mb-3">{rule.description}</p>
                        )}
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Trigger:</span> When {rule.entity_type} {rule.trigger_condition.field} changes to "{rule.trigger_condition.to}"
                          </p>
                          <p>
                            <span className="font-medium">Action:</span> {rule.action_config.title} (Due in {rule.action_config.due_days} days, Priority: {rule.action_config.priority})
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => toggleRuleStatus(rule)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={rule.is_active ? 'Pause Rule' : 'Activate Rule'}
                        >
                          {rule.is_active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Execution Log Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {executionLog.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Executions Yet</h3>
                  <p className="text-gray-600">Workflow rules haven't been triggered yet</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executed At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {executionLog.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.rule_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeBadge(log.entity_type || '')}`}>
                            {log.entity_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(log.executed_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.success ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Success
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.error_message || 'Task created successfully'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingRule ? 'Edit Workflow Rule' : 'Create New Workflow Rule'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., New Seller Follow-up"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of what this rule does"
                  />
                </div>

                {/* Trigger Configuration */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Configuration</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type *</label>
                      <select
                        required
                        value={formData.entity_type}
                        onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="seller">Seller</option>
                        <option value="property">Property</option>
                        <option value="deal">Deal</option>
                        <option value="task">Task</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">When Status Changes To *</label>
                      <input
                        type="text"
                        required
                        value={formData.trigger_to}
                        onChange={(e) => setFormData({ ...formData, trigger_to: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., contacted, qualified"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Configuration */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Configuration</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.action_title}
                        onChange={(e) => setFormData({ ...formData, action_title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Follow up with seller"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
                      <textarea
                        value={formData.action_description}
                        onChange={(e) => setFormData({ ...formData, action_description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Detailed task instructions"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                        <select
                          required
                          value={formData.action_priority}
                          onChange={(e) => setFormData({ ...formData, action_priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due in (days) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="365"
                          value={formData.action_due_days}
                          onChange={(e) => setFormData({ ...formData, action_due_days: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Activate this rule immediately
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
