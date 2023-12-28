import { memo, useContext, useMemo, useEffect, useState } from "react";
import { useAccount, useNetwork, useContractRead } from "wagmi";
import { BigNumber, constants, utils } from "ethers";
import CountUp from 'react-countup';
// Components
import Card from "./utils/Card";
import LoadingSpinner from "./utils/LoadingSpinner";
// Constants
import { STAKING } from "../constants";
// Context
import NotificationContext from "../context/NotificationContext";
// Hooks
import useStaking from "../hooks/useStaking";
import useToken from "../hooks/useToken";

const Staking = () => {

  const UserStats = () => {
    const { chain } = useNetwork();
    const { balance } = useToken();
    const { balance: stakingBalance } = useStaking();
    const [amountStaked, setAmountStaked] = useState(0);
    const { address, isConnected } = useAccount();
    const [totalEarned, setTotalEarned] = useState('0');
    
    const profitCall = useContractRead({
      addressOrName: STAKING[56].address,
      contractInterface: STAKING[56].abi,
      chainId: 56,
      functionName: 'getTotalProfits',
      args: [address],
      enabled: isConnected,
      onSettled: (data, error) => {
        if (error) {
          console.log('Err Fetching Profits', error);
        } else if (data) {
          console.log('Total Earned: ', data.toString());
          setTotalEarned(utils.formatUnits(BigNumber.from(data), 18));
        }
      }
    });

    useEffect(() => {
      profitCall.refetch();
    }, [address, chain?.id, totalEarned, isConnected])

    useEffect(() => {
      if (stakingBalance?.isFetching) return;
      if (!address || !chain?.id) return setAmountStaked(0); 
      if (!stakingBalance?.data) return setAmountStaked(0);
      setAmountStaked(utils.formatEther(stakingBalance?.data));
    }, [address, chain?.id, stakingBalance?.internal?.dataUpdatedAt]);

    return (
      <>
        <div className="flex justify-between">
          <div className="card-header">Currently Staking</div>
          <div className="card-header">Total Staking Profit</div>
        </div>
        <div className="flex justify-between">
          <div className="md:text-2xl text-sm font-bold">
            <CountUp end={amountStaked} decimals={2} separator=","/>&nbsp;RVLX
          </div>
          <div className="md:text-2xl text-sm font-bold">
            <CountUp end={Number(parseFloat(totalEarned).toFixed(2))} decimals={2} separator=","/>&nbsp;RVLX
          </div>
        </div>
      </>
    )
  }

  const WithdrawlForm = memo(() => {
    const { address } = useAccount();
    const { chain } = useNetwork();
    // context
    const { popNotification } = useContext(NotificationContext);
    // hooks
    const { balance: stakingBalance, withdraw } = useStaking();
    // state vars
    const [withdrawlAmount, setWithdrawlAmount] = useState('');
    const [withdrawlIsLoading, setWithdrawlIsLoading] = useState(false);
    const [amountStaked, setAmountStaked] = useState(0);

    const withdrawlAmountWei = useMemo(() => {
      if (!withdrawlAmount) return '0';
      return utils.parseEther(withdrawlAmount.toString());
    }, [withdrawlAmount]);

    const btnClass = useMemo(() => {
      if (amountStaked > 0) {
        return 'btn btn-primary';
      }
      return 'btn btn-disabled';
    }, [amountStaked]);

    const handleWithdrawlAmountChanged = (e) => {
      setWithdrawlAmount(e.target.value);
    }

    const maxWithdrawl = () => {
      setWithdrawlAmount(amountStaked);
    }

    useEffect(() => {
      if (stakingBalance?.isFetching) return;
      if (!address || !chain?.id) return setAmountStaked(0); 
      if (!stakingBalance?.data) return setAmountStaked(0);
      setAmountStaked(utils.formatEther(stakingBalance?.data));
    }, [address, chain?.id, stakingBalance?.internal?.dataUpdatedAt]);

    const tryWithdrawl = async () => {
      if (withdrawlIsLoading) return;
      setWithdrawlIsLoading(true);
      try {
        const req = await withdraw({
          args: [withdrawlAmountWei, false]
        })
        popNotification({
          type: 'success',
          title: 'Withdraw Submitted',
          description: `View on ${chain?.blockExplorers?.default.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
        });
        const tx = await req.wait();
        popNotification({
          type: 'success',
          title: 'Withdraw Complete',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
        });
      } catch (e) {
        popNotification({
          type: 'error',
          title: 'Withdraw Error',
          description: e.toString()
        });
      }
      setWithdrawlIsLoading(false);
      setWithdrawlAmount(0);
    }

    WithdrawlForm.displayName = 'WithdrawlForm';
    return (
      <div className="grid grid-flow-col gap-2 mt-4">
        <div className="relative rounded-md shadow-sm">
          <input 
            type="text" 
            name="deposit" 
            id="deposit" 
            value={withdrawlAmount}
            onChange={handleWithdrawlAmountChanged}
            className="input focus:ring-brand-2 focus:border-brand-2 border-2 block w-full pl-7 pr-20 sm:text-sm text-right text-slate-500 border-gray-300 rounded-md"
            placeholder="0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button onClick={() => maxWithdrawl()} className="text-primary mr-5 p-1 text-sm">
              Max
            </button>
          </div>
        </div>
        <button 
          className={btnClass}
          onClick={() => tryWithdrawl()}
        >
          { withdrawlIsLoading
            ? <LoadingSpinner text="Withdrawing"/>
            : <span>Withdraw</span>
          }
        </button>
      </div>
    );
  });

  const DepositForm = memo(() => {
    const { address } = useAccount();
    const { chain } = useNetwork();
    // context
    const { popNotification } = useContext(NotificationContext);
    // hooks
    const { deposit } = useStaking();
    const { 
      approve,
      balance,
      stakingAllowance
    } = useToken();
    // state vars
    const [hasSufficientAllowance, setHasSufficientAllowance] = useState(true);
    const [btnClass, setBtnClass] = useState('btn btn-primary');
    const [depositAmount, setDepositAmount] = useState('');
    const [depositIsLoading, setDepositIsLoading] = useState(false);
    const [approvalIsLoading, setApprovalIsLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);

    const depositAmountWei = useMemo(() => {
      if (!depositAmount) return '0';
      return utils.parseEther(depositAmount.toString());
    }, [depositAmount]);
    const handleDepositAmountChanged = (e) => {
      setDepositAmount(e.target.value);
    }

    const maxDeposit = () => {
      console.log({ tokenBalance })
      setDepositAmount(tokenBalance);
    }

    useEffect(() => {
      if (balance?.isFetching) return;
      if (!address || !chain?.id) return setTokenBalance(0); 
      if (!balance?.data) return setTokenBalance(0);
      setTokenBalance(utils.formatEther(balance?.data));
    }, [address, chain?.id, balance?.internal?.dataUpdatedAt]);

    useEffect(() => {
      let className = 'btn btn-primary';
      if (!address) className += ' btn-disabled';
      setBtnClass(className);
    }, [address, hasSufficientAllowance]);

    useEffect(() => {
      if (stakingAllowance?.isFetching) return;
      const bnStakingAllowance = BigNumber.from(stakingAllowance?.data || '0');
      if (bnStakingAllowance.eq(0)) return setHasSufficientAllowance(false);
      const bnDepositAmount = BigNumber.from(depositAmountWei);
      setHasSufficientAllowance(bnStakingAllowance.gte(bnDepositAmount));
    }, [stakingAllowance?.internal?.dataUpdatedAt]);

    const tryApprove = async () => {
      setApprovalIsLoading(true);
      try {
        const req = await approve({
          args: [STAKING[chain?.id]?.address, constants.MaxUint256]
        });
        popNotification({
          type: 'success',
          title: 'Approval Submitted',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
        });
        const tx = await req.wait();
        popNotification({
          type: 'success',
          title: 'Approval Complete',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
        });
        setHasSufficientAllowance(true);
      } catch (e) {
        popNotification({
          type: 'error',
          title: 'Approval Error',
          description: typeof e === 'object' ? JSON.stringify(e) : e.toString()
        });
      }
      
      setApprovalIsLoading(false);
    }

    const tryDeposit = async () => {
      if (depositIsLoading) return;
      setDepositIsLoading(true);
      try {
        const req = await deposit({
          args: depositAmountWei
        })
        popNotification({
          type: 'success',
          title: 'Deposit Submitted',
          description: `View on ${chain?.blockExplorers?.default.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
        });
        const tx = await req.wait();
        popNotification({
          type: 'success',
          title: 'Deposit Complete',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
        });
      } catch (e) {
        popNotification({
          type: 'error',
          title: 'Deposit Error',
          description: e.toString()
        });
      }
      setDepositIsLoading(false);
      setDepositAmount(0);
    }

    DepositForm.displayName = 'DespoitForm';
    return (
      <div className="grid grid-flow-col gap-2 mt-4">
        { !hasSufficientAllowance
          ?
            <button 
              className={btnClass}
              onClick={() => tryApprove()}
            >
              { approvalIsLoading 
                ? <LoadingSpinner text="Enabling"/>
                : `Enable`
              }
            </button>
          :
          <>
            <div className="relative rounded-md shadow-sm">
              <input 
                type="text" 
                name="deposit" 
                id="deposit" 
                value={depositAmount}
                onChange={handleDepositAmountChanged}
                className="input focus:ring-brand-2 focus:border-brand-2 border-2 block w-full pl-7 pr-20 sm:text-sm text-right text-slate-500 border-gray-300 rounded-md"
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button onClick={() => maxDeposit()} className="text-primary mr-5 p-1 text-sm">
                  Max
                </button>
              </div>
            </div>
            <button 
              className={btnClass}
              onClick={() => tryDeposit()}
            >
              { depositIsLoading
                ? <LoadingSpinner text="Depositing"/>
                : <span>Deposit</span>
              }
            </button>
          </>
        }
      </div>
    );
  });

  const StakingForm = () => {
    const [activeTab, setActiveTab] = useState('deposit');

    return (
      <div>
        <div className="flex justify-center mt-4">
          <div className="tabs tabs-boxed">
            <a 
              className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >Deposit</a> 
            <a 
              className={`tab ${activeTab === 'withdraw' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >Withdraw</a>
          </div>
        </div>
        {
          activeTab === 'deposit' ? <DepositForm /> : <WithdrawlForm />
        }
      </div>
    )
  }

  return (
    <Card title="Staking">
      <UserStats />
      <StakingForm />
    </Card>
  );
}

Staking.displayName = 'Staking';
export default Staking;