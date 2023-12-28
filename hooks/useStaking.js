import { useEffect, useState } from 'react';
import { 
  useAccount, 
  useContractRead,
  useDeprecatedContractWrite,
  useNetwork 
} from 'wagmi';
// constants
import { defaultChainId, STAKING } from '../constants';

export const useStaking = () => {
  const { address, isConnected } = useAccount();
  const { chain: connectedChain } = useNetwork();
  const [chain, setChain] = useState({ id: defaultChainId });

  useEffect(() => {
    if (isConnected && connectedChain) {
      setChain(connectedChain);
    } else {
      setChain({ id: defaultChainId });
    }
  }, [isConnected, connectedChain]);

  const stakingContract = {
    addressOrName: STAKING[chain?.id]?.address,
    contractInterface: STAKING[chain?.id]?.abi,
  }

  // Balance
  const balance = useContractRead({
    ...stakingContract,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    cacheOnBlock: true,
    enabled: isConnected,
  });

  // Deposit
  const { 
    writeAsync: deposit 
  } = useDeprecatedContractWrite({
    ...stakingContract,
    functionName: 'deposit',
  });

  // Withdraw
  const { 
    writeAsync: withdraw 
  } = useDeprecatedContractWrite({
    ...stakingContract,
    functionName: 'withdraw',
  });
  
  return {
    balance,
    deposit,
    withdraw
  }
}

export default useStaking;