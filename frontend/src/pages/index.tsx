import Head from 'next/head'
import PiggyCard from '@/components/PiggyCard'
import { usePiggyBank } from '@/hooks/usePiggyBank'

export default function Home() {
  const { balance, handleDeposit, handleWithdraw } = usePiggyBank()

  return (
    <>
      <Head>
        <title>cPiggyBank</title>
      </Head>
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <PiggyCard
          balance={balance}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />
      </main>
    </>
  )
}
