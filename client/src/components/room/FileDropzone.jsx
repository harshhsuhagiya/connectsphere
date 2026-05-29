import React, { useCallback, useState, useEffect } from 'react';
import { UploadCloud, File, Download } from 'lucide-react';
import api from '../../utils/api';

const FileDropzone = ({ roomId, socket }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
    if (socket) {
      socket.on('file-shared', (fileData) => {
        setFiles(prev => [fileData, ...prev]);
      });
    }
    return () => {
      if (socket) socket.off('file-shared');
    };
  }, [roomId, socket]);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}/files`);
      setFiles(res.data.files.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      // 1. Get Presigned URL
      const { data } = await api.get(`/rooms/${roomId}/files/presigned-url`, {
        params: { filename: file.name, fileType: file.type }
      });

      // 2. Upload to S3 directly from client
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Save Metadata
      const metaRes = await api.post(`/rooms/${roomId}/files/metadata`, {
        originalName: file.name,
        s3Url: data.s3Url,
        mimeType: file.type,
        size: file.size
      });

      setFiles(prev => [metaRes.data.file, ...prev]);
      if (socket) socket.emit('file-shared', { roomId, fileData: metaRes.data.file });

    } catch (error) {
      console.error('Upload failed', error);
      alert('File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) uploadFile(droppedFiles[0]);
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) uploadFile(e.target.files[0]);
  };

  return (
    <div className="flex flex-col h-full w-80 border-l border-border bg-surface shrink-0 z-20">
      <div className="h-12 border-b border-border flex items-center px-4 font-semibold text-text">
        Shared Files
      </div>

      <div 
        className={`p-6 m-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
      >
        <UploadCloud className={`w-10 h-10 mb-2 transition-colors ${isDragging ? 'text-primary' : 'text-textSecondary'}`} />
        <p className="text-sm font-medium">{uploading ? 'Uploading securely...' : 'Click or drag file here'}</p>
        <p className="text-xs text-textSecondary mt-1">AWS S3 Pre-signed URL</p>
        <input id="fileUpload" type="file" className="hidden" onChange={handleFileSelect} disabled={uploading} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
        {files.map(f => (
          <div key={f._id} className="bg-surface border border-border p-3 rounded-lg flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-primary/10 rounded text-primary shrink-0">
              <File size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-text" title={f.originalName}>{f.originalName}</p>
              <p className="text-xs text-textSecondary mt-0.5">{f.uploader?.name} • {(f.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <a href={f.s3Url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 hover:bg-primary hover:text-white rounded-full text-textSecondary transition-colors">
              <Download size={16} />
            </a>
          </div>
        ))}
        {files.length === 0 && !uploading && (
          <div className="text-center mt-10">
            <p className="text-sm text-textSecondary">No files shared yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;
