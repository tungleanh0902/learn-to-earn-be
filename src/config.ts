import axios from 'axios';
require('dotenv').config();

export const config = {
    'secret': 'nodeauthsecret',
    'database': `${process.env.NEXT_PUBLIC_MONGO}/l2e?retryWrites=true&w=majority&authSource=admin` 
};

export const tonQuery = axios.create({
    baseURL: 'https://testnet.tonapi.io/v2/blockchain/transactions/'
  });

export const MINT_NFT_OPCODE = "0x00000001"
export const OWNER_ADDRESS = "0QAN0ngNyGR2fjacIEZi3ex-4_AvqnhJ7q9gJ9pnbt7MCUHm"
export const SAVE_STREAK_FEE = 1000000 // 0.001 TON
export const MORE_QUIZZ_FEE = 2000000 // 0.002 TON
export const MINT_NFT_FEE = 20000000 // 0.02 TON
export const STORE_FEE = 50000000 // 0.05 TON
export const SHARE_REF = 10 // 10%