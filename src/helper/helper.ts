import { TonClient, Address, beginCell, Cell, loadMessage, storeMessage, Transaction } from "@ton/ton";
import { getHttpEndpoint, Network } from "@orbs-network/ton-access";
import { tonQuery } from "../config";
import { AxiosResponse } from "axios";

export function shuffle(array: []) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array
}

export function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

interface WaitForTransactionOptions {
    address: string;
    hash: string;
    refetchInterval?: number;
    refetchLimit?: number;
}

const waitForTransaction = async (
    options: WaitForTransactionOptions,
    client: TonClient
): Promise<string | null> => {
    const { hash, refetchInterval = 1000, refetchLimit, address } = options;

    return new Promise((resolve) => {
        let refetches = 0;
        const walletAddress = Address.parse(address);
        const interval = setInterval(async () => {
            refetches += 1;
            console.log("waiting transaction...");
            const state = await client.getContractState(walletAddress);
            if (!state || !state.lastTransaction) {
                clearInterval(interval);
                resolve(null);
                return;
            }
            const lastLt = state.lastTransaction.lt;
            const lastHash = state.lastTransaction.hash;
            const lastTx = await client.getTransaction(
                walletAddress,
                lastLt,
                lastHash
            );

            if (lastTx && lastTx.inMessage) {
                const msgCell = beginCell()
                    .store(storeMessage(lastTx.inMessage))
                    .endCell();

                const inMsgHash = msgCell.hash().toString("base64");
                console.log("InMsgHash", inMsgHash);
                if (inMsgHash === hash) {
                    clearInterval(interval);
                    resolve(inMsgHash);
                }
            }
            if (refetchLimit && refetches >= refetchLimit) {
                clearInterval(interval);
                resolve(null);
            }
        }, refetchInterval);
    });
};

export async function getTxData(options: any): Promise<AxiosResponse | null> {
    const { hash, refetchInterval = 1000, refetchLimit } = options;
    return new Promise((resolve) => {
        let refetches = 0;
        const interval = setInterval(async () => {
            refetches += 1;
            console.log("waiting transaction...");
            let txData
            try {
                txData = await tonQuery.get(hash ?? "")
            } catch (error) {
            }
            if (txData?.data["success"] != null) {
                clearInterval(interval);
                resolve(txData)
            }
            if (refetchLimit && refetches >= refetchLimit) {
                clearInterval(interval);
                resolve(null);
            }
        }, refetchInterval);
    });
}