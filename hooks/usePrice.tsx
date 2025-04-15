import { useMemo } from 'react';

 

export function usePrice() {

  const iotaPrice = 0.16

  const priceMap: any = useMemo(() => ({
    IOTA: iotaPrice,
    VUSD: 1,
  }), [iotaPrice]);
  
  const toUSD = (symbol: string, amount: number): number => {
    return amount * priceMap[symbol];
  };

  return {
    toUSD,
    getTokenPrice: (symbol: string) => priceMap[symbol],
  };
}
