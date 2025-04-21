import { useMemo } from 'react';

 

export function usePrice() {
  
  const toUSD = (symbol: string, amount: number, currentPrice: number = 0.16): number => {
    return amount * ( symbol === "IOTA" ? currentPrice : 1 )
  };

  return {
    toUSD
  };
}
