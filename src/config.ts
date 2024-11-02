require('dotenv').config();

export const config = {
    'secret': 'nodeauthsecret',
    'database': `mongodb+srv://${process.env.NEXT_PUBLIC_MONGO_NAME}:${process.env.NEXT_PUBLIC_MONGO_PW}@${process.env.NEXT_PUBLIC_MONGO_CLUSTER}/asset_management?retryWrites=true&w=majority`
    // 'database': `${process.env.NEXT_PUBLIC_MONGO}/l2e?retryWrites=true&w=majority&authSource=admin` 
    // update git
};