import React from 'react';
import { useEffect, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
// helpers
import shortenAddress from '../../helpers/shortenAddress'

export default function Connect() {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { activeConnector, connect, connectors } = useConnect();
  const [hasAccount, setHasAccount] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);
  const showMenuHandler = () => setShowMenu((showMenu) => !showMenu);

  const { disconnect } = useDisconnect();

  useEffect(() => {
    setHasAccount(isConnected && !!address);
  }, [address, isConnected]);

  if (hasAccount) return (
    <div className="top-16 w-56 text-right">
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn m-1">
          <span className="mr-2">{ensName ?? shortenAddress(address)}</span>
            <Jazzicon diameter={20} seed={jsNumberForAddress(address || '0x0')} />
            <ChevronDownIcon
              className="ml-2 -mr-1 h-5 w-5"
              aria-hidden="true"
            />
        </label>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 text-neutral rounded-box w-52">
          <li>
            <a onClick={() => { disconnect(); setShowMenu(false); }}>
              Disconnect
            </a>
          </li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="top-16 w-56 text-right">
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn m-1" onClick={showMenuHandler}>
          Connect
          <ChevronDownIcon
            className="ml-2 -mr-1 h-5 w-5"
            aria-hidden="true"
          />
        </label>
        {showMenu && <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 text-neutral rounded-box w-52">
          { connectors
            .filter(connector => connector.ready && connector.id !== activeConnector?.id)
            .map(connector => (
              <li key={connector.id}>
                <a
                  onClick={async () => {
                    await connect({ connector });
                    setShowMenu(false);
                  }}
                >
                  {connector.name}
                </a>
              </li>
            ))}
        </ul>}
      </div>
    </div>
  )
}