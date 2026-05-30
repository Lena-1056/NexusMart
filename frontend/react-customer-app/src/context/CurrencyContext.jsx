import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1 } // Base currency is now INR
};

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return 'INR';
  });

  useEffect(() => {
    localStorage.setItem('globalCurrency', currencyCode);
  }, [currencyCode]);

  const formatCurrency = (amount) => {
    const c = CURRENCIES[currencyCode] || CURRENCIES.INR;
    return c.symbol + (amount * c.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <CurrencyContext.Provider value={{ currencyCode, setCurrencyCode, formatCurrency, currencies: Object.keys(CURRENCIES) }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
