import React from "react";

import { memo, useContext, useMemo, useEffect, useState } from "react";
import { useAccount, useBalance, useNetwork } from "wagmi";
import { BigNumber, constants, utils } from "ethers";
import CountUp from 'react-countup';
// Components
import Card from "./utils/Card";
import LoadingSpinner from "./utils/LoadingSpinner";
// Constants
import { TOKEN } from "../constants";
// Context
import NotificationContext from "../context/NotificationContext";
// Hooks
import useSwap from "../hooks/useSwap";
import useToken from "../hooks/useToken";

const Swap = memo(() => {
  const UserStats = () => {
    const { address, isConnected } = useAccount();
    const { chain } = useNetwork();
    const { balance } = useToken();
    const nativeBalanceFetch = useBalance({
      addressOrName: address,
      watch: true,
    });
    const [tokenBalance, setTokenBalance] = useState(0);
    const [nativeBalance, setNativeBalance] = useState(0);
    const [hasAccount, setHasAccount] = useState(false);

    useEffect(() => {
      setHasAccount(isConnected && !!address);
    }, [address, isConnected]);
  
    useEffect(() => {
      if (balance?.isFetching) return;
      if (!address || !chain?.id) return setTokenBalance(0); 
      if (!balance?.data) return setTokenBalance(0);
      setTokenBalance(utils.formatEther(balance?.data));
    }, [address, chain?.id, balance?.internal?.dataUpdatedAt]);

    useEffect(() => {
      if (nativeBalanceFetch?.isFetching) return;
      if (!address || !chain?.id) return setNativeBalance(0); 
      if (!nativeBalanceFetch?.data?.value) return setNativeBalance(0);
      setNativeBalance(utils.formatEther(nativeBalanceFetch?.data?.value));
    }, [address, chain?.id, nativeBalanceFetch?.internal?.dataUpdatedAt]);

    return (
      <>
        <div className="flex justify-between">
          <div className="card-header">Your {hasAccount && chain?.nativeCurrency?.symbol} balance</div>
          <div className="card-header">Your RVLX balance</div>
        </div>
        <div className="flex justify-between">
          <div className="md:text-2xl text-sm font-bold">
            <CountUp end={nativeBalance} decimals={2} separator=","/>
          </div>
          <div className="md:text-2xl text-sm font-bold">
            <CountUp end={tokenBalance} decimals={2} separator=","/>
          </div>
        </div>
      </>
    )
  }

  const BuyForm = memo(() => {
    const { address } = useAccount();
    const { chain } = useNetwork();
    const { estimateBuy } = useSwap();
    // context
    const { popNotification } = useContext(NotificationContext);
    // hooks
    const { buy } = useToken();
    const nativeBalanceFetch = useBalance({
      addressOrName: address,
      watch: true
    });
    // state vars
    const [buyAmount, setBuyAmount] = useState('');
    const [buyIsLoading, setBuyIsLoading] = useState(false);
    const [nativeBalance, setNativeBalance] = useState(0);
    const [estimatedOut, setEstimatedOut] = useState(0);

    const buyAmountWei = useMemo(() => {
      if (!buyAmount) return '0';
      return utils.parseEther(buyAmount.toString());
    }, [buyAmount]);

    const btnClass = useMemo(() => {
      if (nativeBalance > 0) {
        return 'btn btn-primary';
      }
      return 'btn btn-disabled';
    }, [nativeBalance]);

    const handleBuyAmountChanged = (e) => {
      if (isNaN(Number(e.target.value))) return;
      setBuyAmount(e.target.value);
    }

    const maxBuy = () => {
      setBuyAmount(nativeBalance);
    }

    useEffect(() => {
      if (!buyAmount || buyAmount === 0 || buyAmount === '') return;
      const a = estimateBuy(buyAmount);
      setEstimatedOut(a.toLocaleString([], {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      }));
    }, [buyAmount]);

    useEffect(() => {
      if (nativeBalanceFetch?.isFetching) return;
      if (!address || !chain?.id) return setNativeBalance(0); 
      if (!nativeBalanceFetch?.data?.value) return setNativeBalance(0);
      setNativeBalance(utils.formatEther(nativeBalanceFetch?.data?.value));
    }, [address, chain?.id, nativeBalanceFetch?.internal?.dataUpdatedAt]);

    const tryBuy = async () => {
      if (buyIsLoading) return;
      setBuyIsLoading(true);
      try {
        const req = await buy({
          args: [address],
          overrides: {
            value: buyAmountWei
          }
        })
        popNotification({
          type: 'success',
          title: 'Buy Submitted',
          description: `View on ${chain?.blockExplorers?.default.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
        });
        const tx = await req.wait();
        popNotification({
          type: 'success',
          title: 'Buy Complete',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
        });
      } catch (e) {
        popNotification({
          type: 'error',
          title: 'Buy Error',
          description: typeof e === 'object' ? JSON.stringify(e) : e.toString()
        });
      }
      setBuyIsLoading(false);
      setBuyAmount(0);
      setEstimatedOut(0);
    }

    BuyForm.displayName = 'BuyForm';
    return (
      <div>
        <div className="grid grid-flow-col gap-2 mt-4">
          <div className="relative rounded-md shadow-sm">
            <input 
              type="text" 
              name="buy" 
              id="buy" 
              value={buyAmount}
              onChange={handleBuyAmountChanged}
              className="input focus:ring-brand-2 focus:border-brand-2 border-2 block w-full pl-7 pr-20 sm:text-sm text-right text-slate-500 border-gray-300 rounded-md"
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button onClick={() => maxBuy()} className="text-primary mr-5 p-1 text-sm">
                Max
              </button>
            </div>
          </div>
          <button 
            className={btnClass}
            onClick={() => tryBuy()}
          >
            { buyIsLoading
              ? <LoadingSpinner text="Buying"/>
              : <span>Buy</span>
            }
          </button>
        </div>
        {
          !estimatedOut ? <></> :
          <div className="grid grid-col-2 gap-2">
            You will get {estimatedOut} RVLX
          </div>
        }
      </div>
    );
  });

  const SellForm = memo(() => {
    const { address } = useAccount();
    const { chain } = useNetwork();
    const { estimateSell } = useSwap();
    // context
    const { popNotification } = useContext(NotificationContext);
    // hooks
    const { 
      balance,
      sell,
    } = useToken();
    // state vars
    const [sellAmount, setSellAmount] = useState('');
    const [sellIsLoading, setSellIsLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [estimatedOut, setEstimatedOut] = useState(0);

    const sellAmountWei = useMemo(() => {
      if (!sellAmount) return '0';
      return utils.parseEther(sellAmount.toString());
    }, [sellAmount]);

    const btnClass = useMemo(() => {
      if (tokenBalance > 0) {
        return 'btn btn-primary';
      }
      return 'btn btn-disabled';
    }, [tokenBalance]);

    const handleSellAmountChanged = (e) => {
      if (isNaN(Number(e.target.value))) return;
      setSellAmount(e.target.value);
    }

    const maxSell = () => {
      setSellAmount(tokenBalance);
    }

    useEffect(() => {
      if (!sellAmount || sellAmount === 0 || sellAmount === '') return;
      const a = estimateSell(sellAmount);
      setEstimatedOut(a.toLocaleString([], {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      }));
    }, [sellAmount]);

    useEffect(() => {
      if (balance?.isFetching) return;
      if (!address || !chain?.id) return setTokenBalance(0); 
      if (!balance?.data) return setTokenBalance(0);
      setTokenBalance(utils.formatEther(balance?.data));
    }, [address, chain?.id, balance?.internal?.dataUpdatedAt]);

    const trySell = async () => {
      if (sellIsLoading) return;
      setSellIsLoading(true);
      try {
        const req = await sell({
          args: sellAmountWei
        })
        popNotification({
          type: 'success',
          title: 'Sell Submitted',
          description: `View on ${chain?.blockExplorers?.default.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${req.hash}`
        });
        const tx = await req.wait();
        popNotification({
          type: 'success',
          title: 'Sell Complete',
          description: `View on ${chain?.blockExplorers?.default?.name}`,
          link: `${chain?.blockExplorers?.default?.url}/tx/${tx.transactionHash}`
        });
      } catch (e) {
        popNotification({
          type: 'error',
          title: 'Sell Error',
          description: typeof e === 'object' ? JSON.stringify(e) : e.toString()
        });
      }
      setSellIsLoading(false);
      setSellAmount(0);
      setEstimatedOut(0);
    }

    SellForm.displayName = 'SellForm';
    return (
      <div>
        <div className="grid grid-flow-col gap-2 mt-4">
          <div className="relative rounded-md shadow-sm">
            <input 
              type="text" 
              name="sell" 
              id="sell" 
              value={sellAmount}
              onChange={handleSellAmountChanged}
              className="input focus:ring-brand-2 focus:border-brand-2 border-2 block w-full pl-7 pr-20 sm:text-sm text-right text-slate-500 border-gray-300 rounded-md"
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button onClick={() => maxSell()} className="text-primary mr-5 p-1 text-sm">
                Max
              </button>
            </div>
          </div>
          <button 
            className={btnClass}
            onClick={() => trySell()}
          >
            { sellIsLoading
              ? <LoadingSpinner text="Selling"/>
              : <span>Sell</span>
            }
          </button>
        </div>
        {
          !estimatedOut ? <></> :
          <div className="grid grid-col-2 gap-2">
            You will get {estimatedOut} {chain?.nativeCurrency?.symbol}
          </div>
        }
      </div>
    );
  });

  const SwapForm = () => {
    const [activeTab, setActiveTab] = useState('buy');

    return (
      <div>
        <div className="flex justify-center mt-4">
          <div className="tabs tabs-boxed">
            <a 
              className={`tab ${activeTab === 'buy' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('buy')}
            >Buy</a> 
            <a 
              className={`tab ${activeTab === 'sell' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('sell')}
            >Sell</a>
          </div>
        </div>
        {
          activeTab === 'buy' ? <BuyForm /> : <SellForm />
        }
      </div>
    )
  }


  return (
    <Card title="Swap">
      <UserStats />
      <SwapForm />
    </Card>
  );
});

Swap.displayName = 'Swap';
export default Swap;