import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Upload, Download, Trash2, Eye, CheckCircle, XCircle, Clock, FileText, Image, Film, File, X } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  revision: { label: 'Revision', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const FILE_ICONS = {
  'image': Image,
  'video': Film,
  'application/pdf': FileText,
  'default': File,
};

function getFileIcon(type) {
  if (type?.startsWith('image/')) return FILE_ICONS['image'];
  if (type?.startsWith('video/')) return FILE_ICONS['video'];
  if (type === 'application/pdf') return FILE_ICONS['application/pdf'];
  return FILE_ICONS['default'];
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AssetManager({ projectId }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = () => {
    api.get(`/assets/project/${projectId}`).then(({ data }) => {
      setAssets(data);
      setLoading(false);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('projectId', projectId);
    formData.append('notes', notes);

    try {
      const res = await api.post('/assets/upload', formData);
      console.log('Upload success:', res.data);
      fetchAssets();
      setShowUploadModal(false);
      setSelectedFile(null);
      setNotes('');
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      alert('Gagal upload file: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = async (assetId, status) => {
    try {
      await api.patch(`/assets/${assetId}/status`, { status });
      fetchAssets();
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const handleDownload = (asset) => {
    const token = localStorage.getItem('token');
    window.open(`/api/download/${asset.id}?token=${token}`, '_blank');
  };

  const getImageUrl = (asset) => {
    const token = localStorage.getItem('token');
    return `/api/download/${asset.id}?token=${token}`;
  };

  const handleDelete = async (assetId) => {
    if (!confirm('Yakin hapus file ini?')) return;
    try {
      await api.delete(`/assets/${assetId}`);
      fetchAssets();
    } catch (err) {
      alert('Gagal hapus file');
    }
  };

  const isImage = (type) => type?.startsWith('image/');

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Creative Assets</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada file. Upload desain, video, atau dokumen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const FileIcon = getFileIcon(asset.fileType);
            const statusConf = STATUS_CONFIG[asset.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;

            return (
              <div key={asset.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                {isImage(asset.fileType) ? (
                  <div
                    className="h-40 bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <img
                      src={getImageUrl(asset)}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <FileIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">{asset.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusConf.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1 mb-3">
                    <p>{formatFileSize(asset.fileSize)} &bull; v{asset.version}</p>
                    <p>oleh {asset.uploader?.name}</p>
                    <p>{new Date(asset.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>

                  {asset.notes && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{asset.notes}</p>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {asset.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(asset.id, 'approved')}
                          className="flex-1 text-xs bg-green-50 text-green-600 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(asset.id, 'revision')}
                          className="flex-1 text-xs bg-red-50 text-red-600 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Revisi
                        </button>
                      </>
                    )}
                    {asset.status !== 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(asset.id, 'pending')}
                        className="flex-1 text-xs bg-yellow-50 text-yellow-600 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Reset Status
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(asset)}
                      className="text-gray-400 hover:text-blue-600 p-1.5"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Upload File</h2>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div>
                      <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Klik untuk pilih file</p>
                      <p className="text-xs text-gray-400 mt-1">Max 50MB &bull; Gambar, PDF, Video, ZIP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="Deskripsi file, versi, dll"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewAsset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAsset(null)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <button onClick={() => setPreviewAsset(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
            <img
              src={getImageUrl(previewAsset)}
              alt={previewAsset.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-2 text-sm">{previewAsset.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
