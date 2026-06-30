import PropTypes from 'prop-types';
import Button from '@/components/chadcn/Button';
import Input from '@/components/chadcn/Input';
import SearchIcon from '@/components/chadcn/icons/SearchIcon';
import XIcon from '@/components/chadcn/icons/XIcon';

const SEARCH_INPUT_TEXT = {
  clear: 'Clear search',
};

export default function SearchInput({ value, onChange, onClear, placeholder }) {
  return (
    <div className="relative w-full">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <SearchIcon />
      </span>
      <Input value={value} onChange={onChange} placeholder={placeholder} className="pl-10 pr-10" />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
          aria-label={SEARCH_INPUT_TEXT.clear}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
