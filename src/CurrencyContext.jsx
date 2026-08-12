import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children, defaultCurrency = 'TZS' }) {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('sf_currency') || defaultCurrency);
  const [rate, setRate] = useState(2600);

  useEffect(() => {
    api
      .settings()
      .then((d) => {
        if (d.exchange_rate) setRate(Number(d.exchange_rate));
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c) => {
    if (!['TZS', 'USD'].includes(c)) return;
    setCurrencyState(c);
    localStorage.setItem('sf_currency', c);
  };

  const formatMoney = (value, opts = {}) => {
    const num = Number(value || 0);
    const precision = opts.precision ?? 2;
    if (currency === 'USD') {
      return `$${(num / rate).toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })}`;
    }
    return `TZS ${num.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`;
  };

  const value = useMemo(
    () => ({ currency, setCurrency, rate, formatMoney }),
    [currency, rate]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
