import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import useToast from '@/components/chadcn/useToast';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
  getStatusVariant,
} from '@/features/business-proposals/constants';
import useBusinessProposal from '@/features/business-proposals/hooks/useBusinessProposal';
import useRefineBusinessProposal from '@/features/business-proposals/hooks/useRefineBusinessProposal';
import Badge from '@/components/chadcn/Badge';

export default function BusinessProposalDetailModal({ proposalId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('en');
  const [refinementText, setRefinementText] = useState('');
  const [refineError, setRefineError] = useState('');
  const { showToast } = useToast();
  const { data, isLoading, isError } = useBusinessProposal(proposalId, isOpen);
  const refineMutation = useRefineBusinessProposal();
  const isRefining = refineMutation.isLoading || refineMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setRefinementText('');
    setRefineError('');
    refineMutation.reset();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const copyCurrentProposal = async () => {
    if (!data || data.status !== 'completed') {
      return;
    }
    const html = activeTab === 'en' ? data.englishHtml : data.hebrewHtml;
    if (!html) {
      showToast(BUSINESS_PROPOSALS_TEXT.detail.copyFailed, 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(html);
      showToast(BUSINESS_PROPOSALS_TEXT.detail.copied, 'success');
    } catch {
      showToast(BUSINESS_PROPOSALS_TEXT.detail.copyFailed, 'error');
    }
  };

  const refineProposal = () => {
    const trimmed = refinementText.trim();
    if (!trimmed) {
      setRefineError(BUSINESS_PROPOSALS_TEXT.detail.refineRequired);
      return;
    }
    if (!data?.id) {
      return;
    }
    setRefineError('');
    refineMutation.mutate(
      { id: data.id, refinementText: trimmed },
      {
        onSuccess: () => {
          setRefinementText('');
          showToast(BUSINESS_PROPOSALS_TEXT.detail.refineQueued, 'success');
        },
        onError: (error) =>
          setRefineError(
            getApiErrorMessage(error, BUSINESS_PROPOSALS_TEXT.detail.refineError),
          ),
      },
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <p className="text-sm text-slate-500">{BUSINESS_PROPOSALS_TEXT.detail.loading}</p>;
    }

    if (isError || !data) {
      return (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {BUSINESS_PROPOSALS_TEXT.loadError}
        </p>
      );
    }

    if (data.status === 'queued' || data.status === 'in_progress') {
      return (
        <p className="text-sm text-indigo-600">
          {BUSINESS_PROPOSALS_TEXT.detail.loadingGeneration}
        </p>
      );
    }

    if (data.status === 'failed') {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-rose-700">
            {BUSINESS_PROPOSALS_TEXT.detail.failed}
          </p>
          {data.generationError ? (
            <p className="text-sm text-rose-600">
              {BUSINESS_PROPOSALS_TEXT.detail.generationErrorPrefix} {data.generationError}
            </p>
          ) : null}
        </div>
      );
    }

    const html = activeTab === 'en' ? data.englishHtml : data.hebrewHtml;
    const panelClass =
      activeTab === 'he'
        ? 'rounded-lg border border-slate-200 p-4 max-h-[60vh] overflow-auto prose max-w-none text-right'
        : 'rounded-lg border border-slate-200 p-4 max-h-[60vh] overflow-auto prose max-w-none';
    return (
      <div
        className={panelClass}
        dir={activeTab === 'he' ? 'rtl' : 'ltr'}
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {BUSINESS_PROPOSALS_TEXT.detail.title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeTab === 'en' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('en')}
            >
              {BUSINESS_PROPOSALS_TEXT.detail.englishTab}
            </Button>
            <Button
              type="button"
              variant={activeTab === 'he' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('he')}
            >
              {BUSINESS_PROPOSALS_TEXT.detail.hebrewTab}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {BUSINESS_PROPOSALS_TEXT.detail.close}
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {data ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={getStatusVariant(data.status)}>
                {BUSINESS_PROPOSALS_TEXT.status[data.status] ?? data.status}
              </Badge>
              <span className="text-xs text-slate-500">{data.customerName}</span>
              {data.status === 'completed' ? (
                <Button type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={copyCurrentProposal}>
                  {BUSINESS_PROPOSALS_TEXT.detail.copy}
                </Button>
              ) : null}
            </div>
          ) : null}
          {data?.status === 'completed' ? (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <label className="block text-sm font-medium text-slate-700">
                {BUSINESS_PROPOSALS_TEXT.detail.refineLabel}
              </label>
              <textarea
                value={refinementText}
                onChange={(event) => setRefinementText(event.target.value)}
                placeholder={BUSINESS_PROPOSALS_TEXT.detail.refinePlaceholder}
                rows={3}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
              />
              {refineError ? (
                <p className="text-sm text-rose-600">{refineError}</p>
              ) : null}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  className="h-9 px-3 text-xs"
                  disabled={isRefining}
                  onClick={refineProposal}
                >
                  {BUSINESS_PROPOSALS_TEXT.detail.refine}
                </Button>
              </div>
            </div>
          ) : null}
          {renderBody()}
        </div>
      </div>
    </div>
  );
}

BusinessProposalDetailModal.propTypes = {
  proposalId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

BusinessProposalDetailModal.defaultProps = {
  proposalId: null,
};
