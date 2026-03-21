import { useState } from 'react';

export default function FileViewer({ file, fileName }) {
  const [showPdf, setShowPdf] = useState(false);

  if (!file) return null;

  const isImage = file.startsWith('data:image');
  const isPdf = file.startsWith('data:application/pdf');

  const openInNewTab = () => {
    // Convert base64 dataURL to blob for reliable viewing
    try {
      const parts = file.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const raw = atob(parts[1]);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      // Fallback: open dataURL directly
      window.open(file, '_blank');
    }
  };

  return (
    <>
      <div className="file-p">
        <div style={{ fontSize: '1.1rem', color: 'var(--tx2)' }}>{isImage ? '\u25A3' : '\u229E'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{fileName}</div>
          <div className="badge b-ok" style={{ marginTop: 3 }}>Uploaded</div>
        </div>
        <button className="btn btn-bd btn-sm" onClick={openInNewTab} title="View document">
          View
        </button>
      </div>
      {isImage && <img src={file} alt={fileName} className="img-p" />}
      {isPdf && showPdf && (
        <div style={{ marginTop: 8 }}>
          <iframe
            src={file}
            title={fileName}
            style={{ width: '100%', height: 500, border: '1px solid var(--bd)', borderRadius: 8 }}
          />
        </div>
      )}
      {isPdf && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 6, fontSize: '.78rem' }}
          onClick={() => setShowPdf(!showPdf)}
        >
          {showPdf ? 'Hide Preview' : 'Preview Inline'}
        </button>
      )}
    </>
  );
}
