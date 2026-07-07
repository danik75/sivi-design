export const CONTRACT_TYPE_LABEL = {
  prepaid_hours: 'Prepaid Hours',
  time_and_materials: 'Time & Materials',
  lump_sum: 'Lump Sum',
  monthly_retainer: 'Monthly Retainer',
};

const num = (v) => (v == null ? null : Number(v));

// Human label for a contract option in the task modal dropdown.
export function contractOptionLabel(c) {
  switch (c.type) {
    case 'prepaid_hours': {
      const h = num(c.hoursPurchased);
      return `Prepaid Hours${h != null ? ` — ${h}h` : ''}`;
    }
    case 'time_and_materials': {
      const r = num(c.hourlyRate);
      return `Time & Materials${r != null ? ` — ${r}/h` : ''}`;
    }
    case 'lump_sum':
      return 'Lump Sum';
    case 'monthly_retainer': {
      const f = num(c.monthlyFee);
      return `Monthly Retainer${f != null ? ` — ${f}/mo` : ''}`;
    }
    default:
      return c.type ?? 'Contract';
  }
}
