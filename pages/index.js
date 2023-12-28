import Head from 'next/head'
// Components
import Notification from '../components/utils/Notification';
import Rewards from '../components/Rewards';
import Staking from '../components/Staking';
import Swap from '../components/Swap';
import Bounty from '../components/Bounty';
// Context
import NotificationContext from '../context/NotificationContext';
// Hooks
import useNotification from '../hooks/useNotification';

export default function Home() {
  const notification = useNotification();
  const notificationState = {
    ...notification
  }

  return (
    <div>
      <Head>
        <title>RevivalX</title>
        <meta name="description" content="RevivalX is a community-based BNB Chain token that focuses on ways to better the current climate within the DeFi space." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <NotificationContext.Provider value={notificationState}>
          <Notification />
          <Swap />
          <Staking />
          <Rewards />
          <Bounty />
        </NotificationContext.Provider>
      </main>
    </div>
  )
}
