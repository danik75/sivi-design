import PropTypes from 'prop-types';

export default function BriefcaseIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6V5a3 3 0 013-3h0a3 3 0 013 3v1m-9 0h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
      />
    </svg>
  );
}

BriefcaseIcon.propTypes = { className: PropTypes.string };
