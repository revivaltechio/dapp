import { memo, useContext, useMemo, useState } from "react";
import { utils } from 'ethers';
import CountUp from 'react-countup';
import { useAccount, useContractRead, useNetwork, useDeprecatedContractWrite } from "wagmi";
// Components
import Card from "./utils/Card";
import LoadingSpinner from "./utils/LoadingSpinner";
// Context
import NotificationContext from "../context/NotificationContext";
// Hooks
import usePrevious from "../hooks/usePrevious";
import useRewardDistributor from "../hooks/useRewardDistributor";
import { TOKEN } from "../constants";

const Rewards = memo(() => {
  const { popNotification } = useContext(NotificationContext);
  const { chain } = useNetwork();
  const { isConnected } = useAccount();
  const [btnClass, setBtnClass] = useState('btn btn-primary w-full');
  const [claimIsLoading, setClaimIsLoading] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [prevRewardAmount, setPrevRewardAmount] = useState(0)

  const btnDisabled = useMemo(() => {
    if (!isConnected) return true;
    if (rewardAmount <= 0.0001) return true;
    return false;
  }, [rewardAmount, isConnected]);

  useContractRead({
    addressOrName: TOKEN[56].address,
    contractInterface: TOKEN[56].abi,
    chainId: 56,
    functionName: 'currentBounty',
    watch: true,
    onSettled: (data, error) => {
        if (error) {
            console.log('Current bounty error', error);
        } else if (data) {
            setPrevRewardAmount(rewardAmount);
            setRewardAmount(utils.formatEther(data));
        }
    }
  });

  const emitSharesCall = useDeprecatedContractWrite({
    addressOrName: TOKEN[56].address,
    contractInterface: TOKEN[56].abi,
    chainId: 56,
    functionName: 'emitShares',
    onSettled: (data, error) => {
        setClaimIsLoading(false);
        if (error) {
            popNotification({
                type: 'error',
                title: 'Claim Error',
                description: typeof e === 'object' ? JSON.stringify(e) : e.toString()
              });
        } else if (data) {
            data.wait(2).then(() => {
                popNotification({
                    type: 'success',
                    title: 'Claim Complete',
                    description: `View on ${chain?.blockExplorers?.default?.name}`,
                    link: `${chain?.blockExplorers?.default?.url}/tx/${data.hash}`
                });
            });
        }
    }
  });

  const claimBounty = () => {
    setClaimIsLoading(true);
    if (claimIsLoading) return;
    emitSharesCall.write();
  }

  return (
    <Card title="Bounty Trigger">
      <div className="flex justify-center font-bold text-3xl mb-2">
        <CountUp start={prevRewardAmount} end={rewardAmount} decimals={4} separator=","/> &nbsp; RVLX
      </div>
      <button 
        onClick={() => claimBounty()} 
        className={`${btnClass} ${btnDisabled ? 'btn-disabled' : null}`}
      >
        { claimIsLoading 
          ? <LoadingSpinner text="Claiming"/>
          : `Claim`
        }
      </button>
    </Card>
  );
});

Rewards.displayName = 'Rewards';
export default Rewards;