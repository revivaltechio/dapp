import { useEffect, useState } from 'react';
import { 
  useAccount, 
  useContractRead,
  useDeprecatedContractWrite,
  useNetwork,
} from 'wagmi';
// constants
import { defaultChainId, REWARD_DISTRIBUTOR } from '../constants';

export const useRewardDistributor = () => {
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

  const rewardDistributorContract = {
    addressOrName: REWARD_DISTRIBUTOR[chain?.id]?.address,
    contractInterface: REWARD_DISTRIBUTOR[chain?.id]?.abi,
  }

  // Balance
  const balance = useContractRead({
    ...rewardDistributorContract,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
    cacheOnBlock: true,
    enabled: isConnected,
  });

  // Transfer
  const { 
    writeAsync: transfer 
  } = useDeprecatedContractWrite({
    ...rewardDistributorContract,
    functionName: 'transfer',
  });
  
  return {
    balance,
    transfer
  }
}

export default useRewardDistributor;