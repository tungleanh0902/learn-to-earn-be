import { TonClient, Address, beginCell, Cell, loadMessage, storeMessage, Transaction } from "@ton/ton";
import { getHttpEndpoint, Network } from "@orbs-network/ton-access";
import { TON_CENTER_API, tonQuery } from "../config";
import axios, { AxiosResponse } from "axios";

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

export const getTransactionByMessage = async (message_hash: string, refetchInterval = 1000, refetchLimit = 60) : Promise<string> => {
    return new Promise((resolve) => {
        let refetches = 0;
        const interval = setInterval(async () => {
            refetches += 1;
            console.log("waiting callApi...");
            let txData
            try {
                txData = await axios({
                    url: `${TON_CENTER_API}?msg_hash=${message_hash}&limit=1&offset=0`,
                    method: "GET",
                })
            } catch (error) {
            }
            if (txData?.data.transactions[0] != null) {
                clearInterval(interval);
                resolve(txData?.data.transactions[0].hash)
            }
            if (refetchLimit && refetches >= refetchLimit) {
                clearInterval(interval);
                resolve("");
            }
        }, refetchInterval);
    });
}

export async function getTxData(options: any): Promise<any | null> {
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
            if (txData?.data.transaction["success"] != null) {
                clearInterval(interval);
                resolve(txData?.data.transaction)
            }
            if (refetchLimit && refetches >= refetchLimit) {
                clearInterval(interval);
                resolve(null);
            }
        }, refetchInterval);
    });
}

export const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));
