import axios from 'axios';
require('dotenv').config();

export const config = {
    'secret': 'nodeauthsecret',
    'database': `mongodb+srv://${process.env.NEXT_PUBLIC_MONGO_NAME}:${process.env.NEXT_PUBLIC_MONGO_PW}@${process.env.NEXT_PUBLIC_MONGO_CLUSTER}/asset_management?retryWrites=true&w=majority`
    // 'database': `${process.env.NEXT_PUBLIC_MONGO}/l2e?retryWrites=true&w=majority&authSource=admin` 
    // update git
};

export const tonQuery = axios.create({
    baseURL: 'https://testnet.tonapi.io/v2/blockchain/transactions/'
  });

export const MINT_NFT_OPCODE = "0x00000001"
export const OWNER_ADDRESS = "0QAN0ngNyGR2fjacIEZi3ex-4_AvqnhJ7q9gJ9pnbt7MCUHm"
export const SAVE_STREAK_FEE = 100000000 // 0.1 TON
export const MORE_QUIZZ_FEE = 200000000 // 0.2 TON
export const MINT_NFT_FEE = 10000000 // 1 TON
export const SHARE_REF = 10 // 10%