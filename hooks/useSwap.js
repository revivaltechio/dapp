import { useEffect, useState } from "react";
import { defaultChainId, LP_TOKEN, TOKEN, WETH } from "../constants";
import { useContractRead, useNetwork } from "wagmi";
import { utils } from "ethers";

const BUY_FEE = 0.877;
const SELL_FEE = 0.847;

export const useSwap = () => {
  const { chain: connectedChain } = useNetwork();
  const [chain, setChain] = useState({ id: defaultChainId });
  const [token0InLp, setToken0InLp] = useState(0);
  const [token1InLp, setToken1InLp] = useState(0);

  const token0Contract = {
    addressOrName: TOKEN[chain?.id]?.address,
    contractInterface: TOKEN[chain?.id]?.abi,
  }

  const token1Contract = {
    addressOrName: WETH[chain?.id]?.address,
    contractInterface: WETH[chain?.id]?.abi,
  }

  const token0LpBalance = useContractRead({
    ...token0Contract,
    functionName: 'balanceOf',
    args: LP_TOKEN[chain?.id]?.address,
    watch: true,
    cacheOnBlock: true,
  });

  const token1LpBalance = useContractRead({
    ...token1Contract,
    functionName: 'balanceOf',
    args: LP_TOKEN[chain?.id]?.address,
    watch: true,
    cacheOnBlock: true,
  });

  useEffect(() => {
    if (token0LpBalance?.isFetching) return;
    if (!token0LpBalance?.data) return;
    setToken0InLp(Number(utils.formatEther(token0LpBalance?.data)));
  }, [token0LpBalance?.internal?.dataUpdatedAt]);

  useEffect(() => {
    if (token1LpBalance?.isFetching) return;
    if (!token1LpBalance?.data) return;
    setToken1InLp(Number(utils.formatEther(token1LpBalance?.data)));
  }, [token1LpBalance?.internal?.dataUpdatedAt]);

  useEffect(() => {
    if (connectedChain?.id) {
      setChain(connectedChain);
    } else {
      setChain({ id: defaultChainId });
    }
  }, [connectedChain]);

  const estimateBuy = (amount) => {    
    return BUY_FEE * ( token0InLp - ( token0InLp * token1InLp / (token1InLp + Number(amount)) ) )
  }

  const estimateSell = (amount) => {
    return SELL_FEE * ( token1InLp - ( token1InLp * token0InLp / (token0InLp + Number(amount)) ) )
  }

  return {
    estimateBuy,
    estimateSell
  }
}

export default useSwap;