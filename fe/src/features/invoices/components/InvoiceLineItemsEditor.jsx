import PropTypes from 'prop-types';
import Button from '@/components/chadcn/Button';
import Input from '@/components/chadcn/Input';
import XIcon from '@/components/chadcn/icons/XIcon';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';
import { INVOICE_TEXT } from '@/features/invoices/constants';

const createLineItem = () => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  sourceType: 'manual',
  sourceId: null,
});

const computeAmount = (qty, price) => (parseFloat(qty || 0) * parseFloat(price || 0)).toFixed(2);

export default function InvoiceLineItemsEditor({ lineItems, onChange, readOnly = false }) {
  const handleFieldChange = (index, field, value) => {
    const updated = lineItems.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, [field]: value };
      next.amount = computeAmount(
        field === 'quantity' ? value : next.quantity,
        field === 'unitPrice' ? value : next.unitPrice
      );
      return next;
    });
    onChange(updated);
  };

  const handleAddLineItem = () => {
    onChange([...lineItems, createLineItem()]);
  };

  const handleRemoveLineItem = (index) => {
    onChange(lineItems.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{INVOICE_TEXT.modal.lineItem.description}</TableHeader>
            <TableHeader>{INVOICE_TEXT.modal.lineItem.quantity}</TableHeader>
            <TableHeader>{INVOICE_TEXT.modal.lineItem.unitPrice}</TableHeader>
            <TableHeader>{INVOICE_TEXT.modal.lineItem.amount}</TableHeader>
            {!readOnly ? <TableHeader>{INVOICE_TEXT.modal.lineItem.remove}</TableHeader> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((item, index) => (
            <TableRow key={`${item.sourceType || 'manual'}-${item.sourceId || 'new'}-${index}`}>
              <TableCell className="min-w-[260px]">
                {readOnly ? (
                  item.description || INVOICE_TEXT.placeholder
                ) : (
                  <Input
                    type="text"
                    value={item.description}
                    onChange={(event) =>
                      handleFieldChange(index, 'description', event.target.value)
                    }
                  />
                )}
              </TableCell>
              <TableCell className="w-28">
                {readOnly ? (
                  item.quantity
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24"
                    value={item.quantity}
                    onChange={(event) => handleFieldChange(index, 'quantity', event.target.value)}
                  />
                )}
              </TableCell>
              <TableCell className="w-36">
                {readOnly ? (
                  item.unitPrice
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) => handleFieldChange(index, 'unitPrice', event.target.value)}
                  />
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium text-slate-900">
                {computeAmount(item.quantity, item.unitPrice)}
              </TableCell>
              {!readOnly ? (
                <TableCell>
                  <Button
                    type="button"
                    variant="danger"
                    className="p-2"
                    onClick={() => handleRemoveLineItem(index)}
                    aria-label={INVOICE_TEXT.modal.lineItem.remove}
                  >
                    <XIcon />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!readOnly ? (
        <Button type="button" variant="ghost" onClick={handleAddLineItem}>
          {INVOICE_TEXT.modal.addLineItem}
        </Button>
      ) : null}
    </div>
  );
}

const lineItemShape = PropTypes.shape({
  description: PropTypes.string,
  quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unitPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sourceType: PropTypes.string,
  sourceId: PropTypes.string,
});

InvoiceLineItemsEditor.propTypes = {
  lineItems: PropTypes.arrayOf(lineItemShape).isRequired,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};
