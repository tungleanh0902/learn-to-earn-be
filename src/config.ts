import axios from 'axios';
require('dotenv').config();

export const config = {
    'secret': 'nodeauthsecret',
    'database': `${process.env.NEXT_PUBLIC_MONGO}/l2e?retryWrites=true&w=majority&authSource=admin` 
};
// NOTE: Change mainnet

export const tonQuery = axios.create({
    baseURL: 'https://testnet.tonapi.io/v2/blockchain/transactions/'
    // baseURL: 'https://tonapi.io/v2/blockchain/transactions/'
  });
// testnet
// export const TON_CENTER_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC"
// export const OWNER_ADDRESS = "0:0dd2780dc864767e369c204662ddec7ee3f02faa7849eeaf6027da676edecc09"
// export const OWNER_ADDRESS_EVM = "0x6fa210085c6f97a3ae5ebde5077d04dbc8d37037"
// export const SAVE_STREAK_FEE = 1000000 // 0.001 TON
// export const MORE_QUIZZ_FEE = 2000000 // 0.002 TON
// export const BUY_VOUCHER = 1000000 // 0.001 TON
// export const MINT_NFT_FEE = 20000000 // 0.02 TON

// export const BADGE_CONTRACT = "0x58ca4689c2d81229cece234d562cac4c0647c23d"
// export const BUY_VOUCHER_EVM = "2000000000000000000" // 2 Kaia
// export const SAVE_STREAK_FEE_EVM = "200000000000000000" // 0.2 Kaia
// export const MORE_QUIZZ_FEE_EVM = "400000000000000000" // 0.4 Kaia
// export const MINT_NFT_FEE_EVM = "4000000000000000000" // 4 Kaia

// mainnet
export const TON_CENTER_RPC = "https://toncenter.com/api/v2/jsonRPC"
export const OWNER_ADDRESS = "0:3eac4dddc10a2336a90d64f08904378d8aa9befa8f72cf9e7ff750f46ff25213"
export const OWNER_ADDRESS_EVM = "0x6fa210085c6f97a3ae5ebde5077d04dbc8d37037"
export const SAVE_STREAK_FEE = 100000000 // 0.1 TON
export const MORE_QUIZZ_FEE = 200000000 // 0.2 TON
export const BUY_VOUCHER = 1000000000 // 1 TON
export const MINT_NFT_FEE = 2000000000 // 2 TON

export const BADGE_CONTRACT = "0xca37de4bc576a2246aef1af56039a10e861a1109"
export const BUY_VOUCHER_EVM = "20000000000000000000" // 20 Kaia
export const SAVE_STREAK_FEE_EVM = "2000000000000000000" // 2 Kaia
export const MORE_QUIZZ_FEE_EVM = "4000000000000000000" // 4 Kaia
export const MINT_NFT_FEE_EVM = "40000000000000000000" // 40 Kaia

export const MINT_NFT_OPCODE = "0x00000001"
export const STORE_FEE = 50000000 // 0.05 TON
export const SHARE_REF = 10 // 10%