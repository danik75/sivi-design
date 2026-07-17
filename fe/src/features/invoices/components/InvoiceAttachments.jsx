import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import Button from '@/components/chadcn/Button';
import {
  deleteInvoiceAttachment,
  getInvoiceAttachment,
  listInvoiceAttachments,
  uploadInvoiceAttachment,
} from '@/features/invoices/services/invoicesApi';

// 15 MB — comfortably under the server's 20 MB JSON body limit once base64 (~1.34x) is applied.
const MAX_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function triggerDownload(attachment) {
  const dataUrl = `data:${attachment.fileMimeType || 'application/octet-stream'};base64,${attachment.fileData}`;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = attachment.fileName || 'attachment';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const PaperclipIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
    />
  </svg>
);

export default function InvoiceAttachments({ invoiceId, className }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null); // attachment id being downloaded/deleted

  const { data: attachments = [], isLoading } = useQuery(
    ['invoice-attachments', invoiceId],
    () => listInvoiceAttachments(invoiceId),
    { enabled: Boolean(invoiceId) },
  );

  const uploadMutation = useMutation((payload) => uploadInvoiceAttachment(invoiceId, payload), {
    onSuccess: () => qc.invalidateQueries(['invoice-attachments', invoiceId]),
  });

  const deleteMutation = useMutation((attachmentId) => deleteInvoiceAttachment(attachmentId), {
    onSuccess: () => qc.invalidateQueries(['invoice-attachments', invoiceId]),
  });

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`File is too large (max ${formatBytes(MAX_BYTES)}).`);
      return;
    }
    setError('');
    try {
      const fileData = await readFileAsBase64(file);
      await uploadMutation.mutateAsync({
        fileData,
        fileName: file.name,
        fileMimeType: file.type || undefined,
        fileSize: file.size,
      });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to upload attachment.');
    }
  }

  async function handleDownload(id) {
    setBusyId(id);
    setError('');
    try {
      const full = await getInvoiceAttachment(id);
      triggerDownload(full);
    } catch {
      setError('Failed to download attachment.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError('');
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      setError('Failed to delete attachment.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments</p>
        <Button
          type="button"
          variant="ghost"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isLoading}
        >
          <PaperclipIcon />
          {uploadMutation.isLoading ? 'Uploading…' : 'Add attachment'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {error ? (
        <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-slate-400">No attachments.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <PaperclipIcon />
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left font-medium text-slate-800 hover:text-indigo-600"
                onClick={() => handleDownload(a.id)}
                disabled={busyId === a.id}
                title="Download"
              >
                {a.fileName}
              </button>
              {a.fileSize != null ? (
                <span className="shrink-0 text-xs text-slate-400">{formatBytes(a.fileSize)}</span>
              ) : null}
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-slate-400 hover:text-rose-500 disabled:opacity-50"
                onClick={() => handleDelete(a.id)}
                disabled={busyId === a.id}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

InvoiceAttachments.propTypes = {
  invoiceId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

InvoiceAttachments.defaultProps = {
  className: 'px-6 py-4',
};
