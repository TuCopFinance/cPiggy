import type { Abi } from 'viem'
import piggyAbiJson from '../../../Contracts/artifacts/contracts/cPiggyBank.sol/cPiggyBank.json'

export const PIGGYBANK_ADDRESS = '0x80B871DF504978707DE1745357493a67Ce3d61A0'
export const abi = piggyAbiJson.abi as Abi
