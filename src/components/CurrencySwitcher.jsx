import { useCurrency } from '../CurrencyContext';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="currency-switch" role="group" aria-label="Currency">
      <button
        type="button"
        className={`currency-btn ${currency === 'TZS' ? 'currency-btn-active' : ''}`}
        onClick={() => setCurrency('TZS')}
      >
        TZS
      </button>
      <button
        type="button"
        className={`currency-btn ${currency === 'USD' ? 'currency-btn-active' : ''}`}
        onClick={() => setCurrency('USD')}
      >
        USD
      </button>
    </div>
  );
}
