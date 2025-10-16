'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { FileText, Plus, Edit2, Trash2, Download, Eye, Copy } from 'lucide-react';

interface ContractTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

interface GeneratedContract {
  id: string;
  template_id: string | null;
  contract_name: string;
  entity_type: string | null;
  entity_id: string | null;
  generated_content: string;
  generated_pdf_url: string | null;
  status: string;
  created_at: string;
  template_name?: string;
}

export default function ContractsPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [generatedContracts, setGeneratedContracts] = useState<GeneratedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'generated'>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState('');

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    template_type: 'purchase_agreement',
    content: '',
    is_active: true
  });

  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [contractName, setContractName] = useState('');

  useEffect(() => {
    loadTemplates();
    loadGeneratedContracts();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }

  async function loadGeneratedContracts() {
    const { data, error } = await supabase
      .from('generated_contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading contracts:', error);
    } else {
      // Enrich with template names
      const enriched = await Promise.all(
        (data || []).map(async (contract) => {
          const template = templates.find(t => t.id === contract.template_id);
          return { ...contract, template_name: template?.name || 'Unknown Template' };
        })
      );
      setGeneratedContracts(enriched);
    }
  }

  async function handleTemplateSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Extract variables from content {variable_name} format
    const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    const matches = [...templateForm.content.matchAll(variableRegex)];
    const variables = [...new Set(matches.map(m => m[1]))];

    const templateData = {
      ...templateForm,
      variables
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from('contract_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (error) {
        alert('Error updating template: ' + error.message);
      } else {
        alert('Template updated successfully!');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        loadTemplates();
        resetTemplateForm();
      }
    } else {
      const { error } = await supabase
        .from('contract_templates')
        .insert([templateData]);

      if (error) {
        alert('Error creating template: ' + error.message);
      } else {
        alert('Template created successfully!');
        setShowTemplateModal(false);
        loadTemplates();
        resetTemplateForm();
      }
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting template: ' + error.message);
    } else {
      loadTemplates();
    }
  }

  function openGenerateModal(template: ContractTemplate) {
    setSelectedTemplate(template);
    setContractName(template.name + ' - ' + new Date().toLocaleDateString());

    // Initialize variable values
    const initialValues: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialValues[variable] = '';
    });
    setVariableValues(initialValues);

    setShowGenerateModal(true);
  }

  async function handleGenerateContract(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTemplate) return;

    // Replace variables in template
    let generatedContent = selectedTemplate.content;
    Object.entries(variableValues).forEach(([variable, value]) => {
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      generatedContent = generatedContent.replace(regex, value);
    });

    const contractData = {
      template_id: selectedTemplate.id,
      contract_name: contractName,
      generated_content: generatedContent,
      status: 'draft'
    };

    const { error } = await supabase
      .from('generated_contracts')
      .insert([contractData]);

    if (error) {
      alert('Error generating contract: ' + error.message);
    } else {
      alert('Contract generated successfully!');
      setShowGenerateModal(false);
      setSelectedTemplate(null);
      setVariableValues({});
      loadGeneratedContracts();
    }
  }

  function downloadContract(contract: GeneratedContract) {
    const blob = new Blob([contract.generated_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contract_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function previewContract(contract: GeneratedContract) {
    setPreviewContent(contract.generated_content);
    setShowPreviewModal(true);
  }

  function copyTemplateContent() {
    navigator.clipboard.writeText(templateForm.content);
    alert('Template content copied to clipboard!');
  }

  function openEditTemplateModal(template: ContractTemplate) {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      content: template.content,
      is_active: template.is_active
    });
    setShowTemplateModal(true);
  }

  function resetTemplateForm() {
    setTemplateForm({
      name: '',
      description: '',
      template_type: 'purchase_agreement',
      content: '',
      is_active: true
    });
  }

  function getTypeBadge(type: string) {
    const colors: any = {
      purchase_agreement: 'bg-blue-100 text-blue-800',
      assignment_contract: 'bg-green-100 text-green-800',
      buyer_agreement: 'bg-purple-100 text-purple-800',
      seller_agreement: 'bg-orange-100 text-orange-800',
      disclosure: 'bg-yellow-100 text-yellow-800',
      addendum: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  function getStatusBadge(status: string) {
    const colors: any = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      signed: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Generator</h1>
          <p className="text-gray-600 mt-1">Create and manage contract templates with variable replacement</p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={() => {
              setEditingTemplate(null);
              resetTemplateForm();
              setShowTemplateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'generated'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Generated Contracts ({generatedContracts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading contracts...</p>
        </div>
      ) : (
        <>
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first contract template</p>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create First Template
                  </button>
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(template.template_type)}`}>
                        {template.template_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}
                    <div className="text-sm text-gray-600 mb-4">
                      <p><span className="font-medium">{template.variables.length}</span> variables</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.variables.slice(0, 3).join(', ')}
                        {template.variables.length > 3 && '...'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openGenerateModal(template)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Generate
                      </button>
                      <button
                        onClick={() => openEditTemplateModal(template)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Generated Contracts Tab */}
          {activeTab === 'generated' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {generatedContracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Generated Contracts</h3>
                  <p className="text-gray-600">Generate contracts from templates to see them here</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedContracts.map((contract) => (
                      <tr key={contract.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{contract.contract_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{contract.template_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(contract.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => previewContract(contract)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadContract(contract)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>

              <form onSubmit={handleTemplateSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                    <input
                      type="text"
                      required
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Purchase Agreement - Standard"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Type *</label>
                    <select
                      required
                      value={templateForm.template_type}
                      onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="purchase_agreement">Purchase Agreement</option>
                      <option value="assignment_contract">Assignment Contract</option>
                      <option value="buyer_agreement">Buyer Agreement</option>
                      <option value="seller_agreement">Seller Agreement</option>
                      <option value="disclosure">Disclosure</option>
                      <option value="addendum">Addendum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of this template"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Template Content * <span className="text-gray-500 font-normal">(Use {'{'}variable_name{'}'} for placeholders)</span>
                    </label>
                    <button
                      type="button"
                      onClick={copyTemplateContent}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  <textarea
                    required
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={20}
                    placeholder="Enter contract template text... Use {seller_name}, {property_address}, {purchase_price}, etc."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active template
                  </label>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setEditingTemplate(null);
                      resetTemplateForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generate Contract Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Generate Contract: {selectedTemplate.name}
              </h2>

              <form onSubmit={handleGenerateContract} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract Name *</label>
                  <input
                    type="text"
                    required
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Smith Purchase Agreement"
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fill in Variables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {variable.replace(/_/g, ' ')}
                        </label>
                        <input
                          type="text"
                          value={variableValues[variable] || ''}
                          onChange={(e) => setVariableValues({
                            ...variableValues,
                            [variable]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedTemplate(null);
                      setVariableValues({});
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Preview</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <pre className="whitespace-pre-wrap font-serif text-sm">{previewContent}</pre>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
