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
export const TON_CENTER_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC"
export const OWNER_ADDRESS = "0:0dd2780dc864767e369c204662ddec7ee3f02faa7849eeaf6027da676edecc09"
export const SAVE_STREAK_FEE = 1000000 // 0.001 TON
export const MORE_QUIZZ_FEE = 2000000 // 0.002 TON
// export const MINT_NFT_FEE = 20000000 // 0.02 TON

// mainnet
// export const TON_CENTER_RPC = "https://toncenter.com/api/v2/jsonRPC"
// export const OWNER_ADDRESS = "0:3eac4dddc10a2336a90d64f08904378d8aa9befa8f72cf9e7ff750f46ff25213"
// export const SAVE_STREAK_FEE = 100000000 // 0.1 TON
// export const MORE_QUIZZ_FEE = 200000000 // 0.2 TON
export const MINT_NFT_FEE = 2000000000 // 2 TON

export const MINT_NFT_OPCODE = "0x00000001"
export const STORE_FEE = 50000000 // 0.05 TON
export const SHARE_REF = 10 // 10%