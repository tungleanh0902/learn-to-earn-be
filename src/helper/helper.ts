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