'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { FileText, Plus, Trash2, Download, Upload, X } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  bucket: string;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedBucket, setSelectedBucket] = useState('property-documents');

  const supabase = createClient();

  const buckets = [
    { value: 'property-images', label: 'Property Images' },
    { value: 'property-documents', label: 'Property Documents' },
    { value: 'investor-documents', label: 'Investor Documents' },
    { value: 'deal-documents', label: 'Deal Documents' }
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      // List files from all buckets
      const allDocs: Document[] = [];

      for (const bucket of buckets) {
        const { data, error } = await supabase
          .storage
          .from(bucket.value)
          .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error(`Error listing files from ${bucket.value}:`, error);
          continue;
        }

        if (data) {
          const docs = data
            .filter(file => file.name !== '.emptyFolderPlaceholder')
            .map(file => ({
              id: file.id || file.name,
              name: file.name,
              path: `${bucket.value}/${file.name}`,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || 'unknown',
              bucket: bucket.value,
              created_at: file.created_at || new Date().toISOString()
            }));

          allDocs.push(...docs);
        }
      }

      setDocuments(allDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const filePath = `${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from(selectedBucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
      });

      await Promise.all(uploadPromises);

      alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setShowModal(false);
      setSelectedFiles(null);
      loadDocuments();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      alert(`Failed to upload files: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const { data, error } = await supabase.storage
        .from(doc.bucket)
        .download(doc.name);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    try {
      const { error } = await supabase.storage
        .from(doc.bucket)
        .remove([doc.name]);

      if (error) throw error;

      alert('Document deleted successfully!');
      loadDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error.message}`);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function getFileIcon(type: string) {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    return '📎';
  }

  function getBucketLabel(bucketValue: string): string {
    return buckets.find(b => b.value === bucketValue)?.label || bucketValue;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Manage your files and documents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Upload Files
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Documents Yet</h2>
          <p className="text-gray-600 mb-6">Upload your first document to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getFileIcon(doc.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                        <div className="text-xs text-gray-500">{doc.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getBucketLabel(doc.bucket)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(doc.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Download"
                    >
                      <Download className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
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

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Files</h2>
              <button
                onClick={() => { setShowModal(false); setSelectedFiles(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedBucket}
                  onChange={(e) => setSelectedBucket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {buckets.map(bucket => (
                    <option key={bucket.value} value={bucket.value}>
                      {bucket.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Files *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          required
                          onChange={(e) => setSelectedFiles(e.target.files)}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Any file type, up to 50MB each
                    </p>
                  </div>
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected files ({selectedFiles.length}):
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <li key={index} className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          {file.name} ({formatFileSize(file.size)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedFiles(null); }}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
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
