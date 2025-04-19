import { useMemo } from 'react';

 

export function usePrice() {

  // const iotaPrice = 0.16

  // const priceMap: any = useMemo(() => ({
  //   IOTA: iotaPrice,
  //   VUSD: 1,
  // }), [iotaPrice]);

  
  const toUSD = (symbol: string, amount: number, currentPrice: number = 0.16): number => {
    return amount * ( symbol === "IOTA" ? currentPrice : 1 )
  };

  return {
    toUSD
  };
}
