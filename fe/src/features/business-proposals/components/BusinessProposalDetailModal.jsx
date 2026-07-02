import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Button from '@/components/chadcn/Button';
import Badge from '@/components/chadcn/Badge';
import Input from '@/components/chadcn/Input';
import useToast from '@/components/chadcn/useToast';
import {
  BUSINESS_PROPOSALS_TEXT,
  getApiErrorMessage,
  getStatusVariant,
} from '@/features/business-proposals/constants';
import useBusinessProposal from '@/features/business-proposals/hooks/useBusinessProposal';
import useRefineBusinessProposal from '@/features/business-proposals/hooks/useRefineBusinessProposal';
import useUpdateProposalContent from '@/features/business-proposals/hooks/useUpdateProposalContent';
import {
  getBusinessProposalPdfUrl,
  getBusinessProposalPdfPreviewUrl,
} from '@/features/business-proposals/services/businessProposalsApi';

const T = BUSINESS_PROPOSALS_TEXT.detail;
const TEXTAREA = 'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none';

function SectionLabel({ children }) {
  return <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">{children}</p>;
}

function PhaseEditor({ phase, onChange, onRemove }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={phase.phase}
          onChange={(e) => onChange({ ...phase, phase: e.target.value })}
          placeholder="Phase name"
          className="flex-1"
        />
        <Input
          value={phase.duration}
          onChange={(e) => onChange({ ...phase, duration: e.target.value })}
          placeholder="Duration"
          className="w-36"
        />
        <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 text-xs px-2">
          {T.removePhase}
        </Button>
      </div>
      <div>
        <SectionLabel>{T.tasksLabel}</SectionLabel>
        <textarea
          className={TEXTAREA}
          rows={3}
          value={phase.tasks.join('\n')}
          onChange={(e) => onChange({ ...phase, tasks: e.target.value.split('\n') })}
        />
      </div>
    </div>
  );
}

function PaymentItemEditor({ item, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="flex-1 grid grid-cols-[1fr_1fr_2fr] gap-2">
        <Input value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} placeholder="Label" />
        <Input value={item.amount} onChange={(e) => onChange({ ...item, amount: e.target.value })} placeholder="Amount" />
        <Input value={item.condition} onChange={(e) => onChange({ ...item, condition: e.target.value })} placeholder="Condition" />
      </div>
      <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 text-xs px-2 mt-1">
        {T.removePaymentItem}
      </Button>
    </div>
  );
}

function DeliverableEditor({ item, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <Input value={item.item} onChange={(e) => onChange({ ...item, item: e.target.value })} placeholder="Deliverable" className="flex-1" />
      <Input value={item.price ?? ''} onChange={(e) => onChange({ ...item, price: e.target.value })} placeholder="Price" className="w-28" />
      <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 text-xs px-2">
        {T.removeDeliverable}
      </Button>
    </div>
  );
}

function StructureSectionEditor({ section, onChange, onRemove }) {
  const updateDeliverable = (i, val) => {
    const next = [...section.deliverables];
    next[i] = val;
    onChange({ ...section, deliverables: next });
  };
  const removeDeliverable = (i) => onChange({ ...section, deliverables: section.deliverables.filter((_, idx) => idx !== i) });
  const addDeliverable = () => onChange({ ...section, deliverables: [...section.deliverables, { item: '', price: '' }] });

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input value={section.name} onChange={(e) => onChange({ ...section, name: e.target.value })} placeholder="Section name" className="flex-1" />
        <Button type="button" variant="ghost" onClick={onRemove} className="text-rose-500 text-xs px-2">
          {T.removeStructureSection}
        </Button>
      </div>
      <Input value={section.description ?? ''} onChange={(e) => onChange({ ...section, description: e.target.value })} placeholder="Description (optional)" />
      <div className="space-y-1.5">
        {section.deliverables.map((d, i) => (
          <DeliverableEditor key={i} item={d} onChange={(v) => updateDeliverable(i, v)} onRemove={() => removeDeliverable(i)} />
        ))}
      </div>
      <Button type="button" variant="ghost" onClick={addDeliverable} className="text-xs text-indigo-600 px-0">
        {T.addDeliverable}
      </Button>
    </div>
  );
}

function ContentEditor({ content, onChange }) {
  const updateTimeline = (i, val) => { const next = [...content.timeline]; next[i] = val; onChange({ ...content, timeline: next }); };
  const removeTimeline = (i) => onChange({ ...content, timeline: content.timeline.filter((_, idx) => idx !== i) });
  const addTimeline = () => onChange({ ...content, timeline: [...content.timeline, { phase: '', duration: '', tasks: [''] }] });

  const updatePayment = (i, val) => { const next = [...content.paymentSchedule]; next[i] = val; onChange({ ...content, paymentSchedule: next }); };
  const removePayment = (i) => onChange({ ...content, paymentSchedule: content.paymentSchedule.filter((_, idx) => idx !== i) });
  const addPayment = () => onChange({ ...content, paymentSchedule: [...content.paymentSchedule, { label: '', amount: '', condition: '' }] });

  const updateStructure = (i, val) => { const next = [...content.projectStructure]; next[i] = val; onChange({ ...content, projectStructure: next }); };
  const removeStructure = (i) => onChange({ ...content, projectStructure: content.projectStructure.filter((_, idx) => idx !== i) });
  const addStructure = () => onChange({ ...content, projectStructure: [...content.projectStructure, { name: '', description: '', deliverables: [{ item: '', price: '' }] }] });

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>{T.sectionGreeting}</SectionLabel>
        <Input value={content.greeting} onChange={(e) => onChange({ ...content, greeting: e.target.value })} />
      </div>

      <div>
        <SectionLabel>{T.sectionIntro}</SectionLabel>
        <textarea className={TEXTAREA} rows={2} value={content.intro} onChange={(e) => onChange({ ...content, intro: e.target.value })} />
      </div>

      <div>
        <SectionLabel>{T.sectionProjectDescription}</SectionLabel>
        <textarea className={TEXTAREA} rows={3} value={content.projectDescription} onChange={(e) => onChange({ ...content, projectDescription: e.target.value })} />
      </div>

      <div className="space-y-2">
        <SectionLabel>{T.sectionTimeline}</SectionLabel>
        {content.timeline.map((ph, i) => (
          <PhaseEditor key={i} phase={ph} onChange={(v) => updateTimeline(i, v)} onRemove={() => removeTimeline(i)} />
        ))}
        <Button type="button" variant="ghost" onClick={addTimeline} className="text-xs text-indigo-600 px-0">{T.addPhase}</Button>
      </div>

      <div className="space-y-2">
        <SectionLabel>{T.sectionPayment}</SectionLabel>
        <div>
          <p className="text-xs text-slate-500 mb-1">{T.totalPriceLabel}</p>
          <Input value={content.totalPrice} onChange={(e) => onChange({ ...content, totalPrice: e.target.value })} placeholder="e.g. 15,000 ₪" />
        </div>
        {content.paymentSchedule.map((item, i) => (
          <PaymentItemEditor key={i} item={item} onChange={(v) => updatePayment(i, v)} onRemove={() => removePayment(i)} />
        ))}
        <Button type="button" variant="ghost" onClick={addPayment} className="text-xs text-indigo-600 px-0">{T.addPaymentItem}</Button>
      </div>

      <div className="space-y-2">
        <SectionLabel>{T.sectionStructure}</SectionLabel>
        {content.projectStructure.map((sec, i) => (
          <StructureSectionEditor key={i} section={sec} onChange={(v) => updateStructure(i, v)} onRemove={() => removeStructure(i)} />
        ))}
        <Button type="button" variant="ghost" onClick={addStructure} className="text-xs text-indigo-600 px-0">{T.addStructureSection}</Button>
      </div>
    </div>
  );
}

export default function BusinessProposalDetailModal({ proposalId, isOpen, onClose }) {
  const [viewTab, setViewTab] = useState('details');
  const [editedContent, setEditedContent] = useState(null);
  const [refinementText, setRefinementText] = useState('');
  const [refineError, setRefineError] = useState('');
  const { showToast } = useToast();
  const { data, isLoading, isError } = useBusinessProposal(proposalId, isOpen);
  const refineMutation = useRefineBusinessProposal();
  const updateMutation = useUpdateProposalContent();
  const isRefining = refineMutation.isLoading || refineMutation.isPending;
  const isSaving = updateMutation.isLoading || updateMutation.isPending;

  // Reset transient UI whenever the modal opens or switches to another proposal.
  useEffect(() => {
    if (!isOpen) return;
    setViewTab('details');
    setRefinementText('');
    setRefineError('');
    refineMutation.reset();
    updateMutation.reset();
  }, [isOpen, proposalId]);

  // Sync the editable content from the fetched proposal. Depending on isOpen and
  // proposalId (not just the contentJson reference) ensures the editor populates
  // even when the query is already cached — otherwise the details only appeared
  // on the second open.
  useEffect(() => {
    if (!isOpen) return;
    setEditedContent(data?.contentJson ? JSON.parse(JSON.stringify(data.contentJson)) : null);
  }, [isOpen, proposalId, data?.contentJson]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!editedContent || !data?.id) return;
    updateMutation.mutate(
      { id: data.id, contentJson: editedContent },
      {
        onSuccess: () => showToast(T.saveSuccess, 'success'),
        onError: (err) => showToast(getApiErrorMessage(err, T.saveError), 'error'),
      },
    );
  };

  const handleRefine = () => {
    const trimmed = refinementText.trim();
    if (!trimmed) { setRefineError(T.refineRequired); return; }
    if (!data?.id) return;
    setRefineError('');
    refineMutation.mutate(
      { id: data.id, refinementText: trimmed },
      {
        onSuccess: () => { setRefinementText(''); setEditedContent(null); showToast(T.refineQueued, 'success'); },
        onError: (err) => setRefineError(getApiErrorMessage(err, T.refineError)),
      },
    );
  };

  const handleDownloadPdf = () => {
    if (!data?.id) return;
    window.open(getBusinessProposalPdfUrl(data.id), '_blank');
  };

  const renderBody = () => {
    if (isLoading) return <p className="text-sm text-slate-500">{T.loading}</p>;

    if (isError || !data) {
      return (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {BUSINESS_PROPOSALS_TEXT.loadError}
        </p>
      );
    }

    if (data.status === 'queued' || data.status === 'in_progress') {
      return <p className="text-sm text-indigo-600">{T.loadingGeneration}</p>;
    }

    if (data.status === 'failed') {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-rose-700">{T.failed}</p>
          {data.generationError && (
            <p className="text-sm text-rose-600">{T.generationErrorPrefix} {data.generationError}</p>
          )}
        </div>
      );
    }

    const currentContent = editedContent?.he;
    if (!currentContent) {
      return <p className="text-sm text-slate-400">No content available.</p>;
    }

    return (
      <ContentEditor
        content={currentContent}
        onChange={(updated) => setEditedContent((prev) => ({ ...prev, he: updated }))}
      />
    );
  };

  const isCompleted = data?.status === 'completed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{T.title}</h2>
            {data && (
              <Badge variant={getStatusVariant(data.status)}>
                {BUSINESS_PROPOSALS_TEXT.status[data.status] ?? data.status}
              </Badge>
            )}
            {data?.customerName && <span className="text-xs text-slate-500">{data.customerName}</span>}
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>{T.close}</Button>
        </div>

        {/* Tabs */}
        {isCompleted && (
          <div className="flex items-center gap-1 border-b border-slate-100 px-6">
            {[
              { key: 'details', label: T.detailsTab },
              { key: 'preview', label: T.previewTab },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setViewTab(tab.key)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  viewTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isCompleted && viewTab === 'preview' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button type="button" variant="primary" className="h-8 px-3 text-xs" onClick={handleDownloadPdf}>
                  {T.downloadPdf}
                </Button>
              </div>
              <iframe
                src={getBusinessProposalPdfPreviewUrl(data.id)}
                title="Proposal PDF Preview"
                className="w-full rounded-lg border border-slate-200"
                style={{ height: '70vh' }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {isCompleted && (
                <div className="flex items-center justify-end">
                  <Button type="button" variant="primary" className="h-8 px-3 text-xs" onClick={handleSave} disabled={isSaving}>
                    {T.saveContent}
                  </Button>
                </div>
              )}

              {/* Refine panel */}
              {isCompleted && (
                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <label className="block text-sm font-medium text-slate-700">{T.refineLabel}</label>
                  <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder={T.refinePlaceholder}
                    rows={2}
                    className={TEXTAREA}
                  />
                  {refineError && <p className="text-sm text-rose-600">{refineError}</p>}
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" className="h-8 px-3 text-xs" disabled={isRefining} onClick={handleRefine}>
                      {T.refine}
                    </Button>
                  </div>
                </div>
              )}

              {/* Editable content / status */}
              {renderBody()}
            </div>
          )}
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
