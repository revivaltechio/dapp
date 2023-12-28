import { memo, useContext, useEffect, useState } from "react";
import { utils } from 'ethers';
import CountUp from 'react-countup';
import { useAccount, useNetwork } from "wagmi";
// Components
import Card from "./utils/Card";
import LoadingSpinner from "./utils/LoadingSpinner";
// Context
import NotificationContext from "../context/NotificationContext";
// Hooks
import usePrevious from "../hooks/usePrevious";
import useRewardDistributor from "../hooks/useRewardDistributor";

const Rewards = memo(() => {
  const { popNotification } = useContext(NotificationContext);
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { balance, transfer } = useRewardDistributor();
  const [btnClass, setBtnClass] = useState('btn btn-primary w-full');
  const [claimIsLoading, setClaimIsLoading] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const prevRewardAmount = usePrevious(rewardAmount);

  useEffect(() => {
    if (balance?.isFetching) return;
    if (!balance?.data) return setRewardAmount(0);
    setRewardAmount(utils.formatEther(balance?.data));
  }, [balance?.internal?.dataUpdatedAt]);

  useEffect(() => {
    let className = 'btn btn-primary  w-full';
    if (!address || !rewardAmount || rewardAmount === 0) className += ' btn-disabled';
    setBtnClass(className);
  }, [address, rewardAmount]);

  const tryClaim = async () => {
    if (claimIsLoading) return;
    setClaimIsLoading(true);
    try {
      const req = await transfer({
        args: [address, 0]
      })
      popNotification({
        type: 'success',
        title: 'Claim Submitted',
        description: `View on ${chain?.blockExplorers?.default.name}`,
        link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
      });
      const tx = await req.wait();
      popNotification({
        type: 'success',
        title: 'Claim Complete',
        description: `View on ${chain?.blockExplorers?.default?.name}`,
        link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
      });
    } catch (e) {
      popNotification({
        type: 'error',
        title: 'Claim Error',
        description: typeof e === 'object' ? JSON.stringify(e) : e.toString()
      });
    }
    setClaimIsLoading(false);
  }

  return (
    <Card title="Your Rewards">
      <div className="flex justify-center font-bold text-3xl mb-2">
        <CountUp start={prevRewardAmount} end={rewardAmount} decimals={4} separator=","/> &nbsp; BUSD
      </div>
      <button 
        onClick={() => tryClaim()} 
        className={`${btnClass} ${rewardAmount <= 0.0001 ? 'btn-disabled' : null}`}
        disabled={rewardAmount <= 0.0001}
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