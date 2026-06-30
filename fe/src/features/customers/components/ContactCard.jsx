import PropTypes from 'prop-types';
import Badge from '../../../components/chadcn/Badge';
import Button from '../../../components/chadcn/Button';
import FormField from '../../../components/chadcn/FormField';
import Input from '../../../components/chadcn/Input';
import { CUSTOMER_TEXT } from '../constants';

export default function ContactCard({ contact, index, onChange, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            {CUSTOMER_TEXT.contactCard.title(index)}
          </h3>
          {index === 0 ? (
            <Badge variant="primary">{CUSTOMER_TEXT.contactCard.primary}</Badge>
          ) : null}
        </div>
        <Button
          type="button"
          variant="danger"
          className="px-3 py-2 text-xs"
          onClick={() => onRemove(index)}
        >
          {CUSTOMER_TEXT.contactCard.remove}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={CUSTOMER_TEXT.contactCard.emailLabel}>
          <Input
            type="email"
            value={contact.email}
            onChange={(event) => onChange(index, 'email', event.target.value)}
            placeholder={CUSTOMER_TEXT.contactCard.emailPlaceholder}
          />
        </FormField>
        <FormField label={CUSTOMER_TEXT.contactCard.phoneLabel}>
          <Input
            value={contact.phone}
            onChange={(event) => onChange(index, 'phone', event.target.value)}
            placeholder={CUSTOMER_TEXT.contactCard.phonePlaceholder}
          />
        </FormField>
      </div>
      <FormField label={CUSTOMER_TEXT.contactCard.addressLabel} className="mt-4">
        <Input
          value={contact.address}
          onChange={(event) => onChange(index, 'address', event.target.value)}
          placeholder={CUSTOMER_TEXT.contactCard.addressPlaceholder}
        />
      </FormField>
    </div>
  );
}

ContactCard.propTypes = {
  contact: PropTypes.shape({
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
