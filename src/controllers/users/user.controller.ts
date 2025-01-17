import { helperFunction } from "../seasonBadge/seasonBadge.controller"
import mongoose from "mongoose"
import { OWNER_ADDRESS, SAVE_STREAK_FEE, MORE_QUIZZ_FEE, SHARE_REF, MINT_NFT_FEE, STORE_FEE, TON_CENTER_RPC, OWNER_ADDRESS_EVM, SAVE_STREAK_FEE_EVM, MORE_QUIZZ_FEE_EVM } from "../../config"
import { Address, beginCell, Cell, internal, toNano, TonClient, WalletContractV4 } from "@ton/ton";
import { getTxData, sleep } from "../../helper/helper";
import { mnemonicToWalletKey } from '@ton/crypto';
import { createTracking } from "../../controllers/tracking/tracking.controller";
import Web3 from "web3";

const SeasonBadgeTx = require('../../models/seasonBadgeTx.model')
const User = require('../../models/users.model')
const TxOnchain = require('../../models/txOnchain.model')
const DailyAttendence = require('../../models/dailyAttendance.model')
const Voucher = require('../../models/voucher.model')

require('dotenv').config()

export const onManageUser = {
    doDailyAttendance: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            if (await checkDailyAttendance(_id) == false) {
                await DailyAttendence.create({
                    userId: _id
                })

                let yesterdayCheckin = await checkYesterdayAttendance(_id)
                let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                let bonusPoint = 0
                if (yesterdayCheckin == true || user.hasStreakSaver == true) {
                    bonusPoint = user.streak * 1000
                } else {
                    bonusPoint = 1000
                }

                bonusPoint = user.multiplier * bonusPoint

                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + bonusPoint * user.multiplier,
                    streak: yesterdayCheckin || user.hasStreakSaver ? user.streak + 1 : 1,
                    hasStreakSaver: false,
                })

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), bonusPoint * user.multiplier)
                }

                let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                await createTracking(_id)

                return res.status(200).send({
                    data: {
                        points: bonusPoint * user.multiplier,
                        user: newUser
                    }
                });
            } else {
                return res.status(400).send({
                    message: "Already daily checkin"
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetUserInfo: async (req: any, res: any, next: any) => {
        try {
            const userId = req.body.userId
            let user = await User.findOne({
                _id: new mongoose.Types.ObjectId(userId)
            })
            return res.status(200).send({
                data: {
                    user: user
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doRef: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const ref = req.body.ref

            let refUser = await User.findOne({
                refCode: ref
            })

            let user = await User.findOne({
                _id: new mongoose.Types.ObjectId(_id)
            })

            if (ref == user.telegramUserId) {
                return res.status(400).send({
                    message: "Cannot self referal"
                });
            }

            if (user.refUser != null) {
                return res.status(400).send({
                    message: "Already have referal"
                });
            } else {
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + 1000 * user.multiplier,
                    refUser: refUser._id
                })

                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(refUser._id.toString())
                }, {
                    points: refUser.points + 1000 * refUser.multiplier,
                    refCount: refUser.refCount + 1,
                })
                let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                await createTracking(_id)

                return res.status(200).send({
                    data: {
                        points: 1000 * user.multiplier,
                        user: newUser
                    }
                });
            }

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doConnectWallet: async (req: any, res: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ address: req.body.address })
            if (user != null) {
                return res.status(400).send({
                    message: "This wallet is already connected"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                address: req.body.address,
            })
            return res.status(200).send({
                message: "Success"
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doConnectEvmWallet: async (req: any, res: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ evmAddress: req.body.evmAddress })
            if (user != null) {
                return res.status(400).send({
                    message: "This wallet is already connected"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                evmAddress: req.body.evmAddress.toLowerCase(),
            })
            return res.status(200).send({
                message: "Success"
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCheckYesterdayCheckin: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            return res.status(200).send({
                data: await checkYesterdayAttendance(_id)
            })
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCheckDailyAttendance: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            if (await checkDailyAttendance(_id) == false) {
                return res.status(200).send({
                    data: false
                });
            } else {
                return res.status(200).send({
                    data: true
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doSaveStreak: async (req: any, res: any, next: any) => {
        try {
            const boc = req.body.boc
            const _id = req.user.id

            let tx = Cell.fromBase64(boc).hash().toString("base64")
            let txData = await getTxData({
                hash: tx,
                refetchLimit: 60
            })
            if (txData == null) {
                return res.status(400).send({
                    message: "Invalid boc"
                });
            }
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            let time = txData.data["utime"] * 1000
            let txTime = new Date(time)
            let now = new Date()
            let diffMins = Math.round((now.getTime() - txTime.getTime()) / (60 * 60 * 1000));
            let ownerAddress = Address.parse(OWNER_ADDRESS).toRawString()

            if (SAVE_STREAK_FEE != txData.data["out_msgs"][0].value.toString()
                || user.address != txData.data["out_msgs"][0].source.address
                || ownerAddress != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                hasStreakSaver: true,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "save_streak",
                amount: SAVE_STREAK_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doSaveStreakKaia: async (req: any, res: any, next: any) => {
        try {
            const tx = req.body.tx
            const _id = req.user.id

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            const web3 = new Web3(process.env.RPC_KAIA);
            let txReceipt = await web3.eth.getTransactionReceipt(tx)
            let txData = await web3.eth.getTransaction(tx)
        
            if (txReceipt.status.toString() != "1"
                || user.evmAddress != txData.from
                || OWNER_ADDRESS_EVM != txData.to
                || SAVE_STREAK_FEE_EVM != txData.value
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }
            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                hasStreakSaver: true,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "save_streak",
                amount: SAVE_STREAK_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doBuyMoreQuizz: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const boc = req.body.boc

            let tx = Cell.fromBase64(boc).hash().toString("base64")
            let txData = await getTxData({
                hash: tx,
                refetchLimit: 60
            })
            if (txData == null) {
                return res.status(400).send({
                    message: "Invalid boc"
                });
            }
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            let time = txData.data["utime"] * 1000
            let txTime = new Date(time)
            let now = new Date()
            let diffMins = Math.round((now.getTime() - txTime.getTime()) / (60 * 60 * 1000));
            let ownerAddress = Address.parse(OWNER_ADDRESS).toRawString()

            if (MORE_QUIZZ_FEE != txData.data["out_msgs"][0].value.toString()
                || user.address != txData.data["out_msgs"][0].source.address
                || ownerAddress != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                moreQuizz: user.moreQuizz + 8,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "buy_quizz",
                amount: MORE_QUIZZ_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doBuyMoreQuizzKaia: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const tx = req.body.tx

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            
            const web3 = new Web3(process.env.RPC_KAIA);
            let txReceipt = await web3.eth.getTransactionReceipt(tx)
            let txData = await web3.eth.getTransaction(tx)
            if (txReceipt.status.toString() != "1"
                || user.evmAddress != txData.from
                || OWNER_ADDRESS_EVM != txData.to
                || MORE_QUIZZ_FEE_EVM != txData.value
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                moreQuizz: user.moreQuizz + 8,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "buy_quizz",
                amount: MORE_QUIZZ_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetLeaderboard: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let limit = parseInt(req.query.limit) || 10;

            const users = await User.aggregate([
                { $sort: { points: -1 } },
                {
                    $group: {
                        _id: null,
                        users: { $push: "$$ROOT" }
                    }
                },
                { $unwind: { path: "$users", includeArrayIndex: "rank" } },
                {
                    $addFields: {
                        "users.rank": { $add: ["$rank", 1] }
                    }
                },
                { $replaceRoot: { newRoot: "$users" } },
                { $skip: 0 },
                { $limit: limit }
            ]);

            let userRank = 0
            const allUsers = await User.find({ role: "user" }).sort({ points: -1 });
            let indexOfUser = 0
            userRank = allUsers.findIndex((u: any, idx: any) => {
                indexOfUser = idx;
                return u._id.equals(new mongoose.Types.ObjectId(_id))
            }) + 1;

            let usersNearCurrentRank = []
            let checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            if (checkBoughtSeasonBadge[0]) {
                usersNearCurrentRank.push(allUsers[indexOfUser - 2])
                usersNearCurrentRank.push(allUsers[indexOfUser - 1])
                usersNearCurrentRank.push(allUsers[indexOfUser])
                usersNearCurrentRank.push(allUsers[indexOfUser + 1])
                usersNearCurrentRank.push(allUsers[indexOfUser + 2])
            }

            return res.status(200).send({
                data: {
                    leaderboard: users,
                    currentRank: userRank,
                    usersNearCurrentRank
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCheckTop10: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let availableVoucher = await Voucher.find({ owner: null })
            if (availableVoucher.length == 0) {
                return res.status(400).send({
                    message: "Out of available voucher"
                });
            }
            let userRank = getCurrentRank(_id)
            return res.status(200).send({
                data: {
                    userRank: userRank,
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetMintBodyData: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const refUserId = req.body.refUserId // ref user
            const tokenId = req.body.tokenId

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            let userAddress = Address.parse(OWNER_ADDRESS)
            if (refUserId != null) {
                let refUserFrom = await User.findOne({ _id: new mongoose.Types.ObjectId(refUserId) })
                console.log(refUserFrom.address);
                if (refUserFrom.address == null || refUserFrom.address == "") {
                    userAddress = Address.parse(OWNER_ADDRESS)
                } else {
                    userAddress = Address.parse(refUserFrom.address)
                }
            }
            const nftItemContent = beginCell();
            if (user.address == null) {
                return res.status(400).send({
                    message: "Please link your account with your wallet"
                });
            }

            let latestSeasonBadgeTx = await SeasonBadgeTx.findOne().sort({ createdAt: -1 });
            if (latestSeasonBadgeTx.tokenId == tokenId.toString()) {
                return res.status(400).send({
                    message: "Please buy again"
                });
            }

            nftItemContent.storeAddress(Address.parse(user.address));

            const uriContent = beginCell();
            uriContent.storeBuffer(Buffer.from("https://shorturl.at/LBsGq"));
            nftItemContent.storeRef(uriContent.endCell());
            let coins = MINT_NFT_FEE + STORE_FEE
            let body = beginCell()
                .storeUint(1, 32)
                .storeUint(Date.now(), 64)
                .storeUint(tokenId, 64)
                .storeCoins(coins)
                .storeRef(nftItemContent)
                .storeAddress(userAddress)
                .endCell()
            return res.status(200).send({
                data: {
                    body_data: body.toBoc().toString("base64")
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doWithdrawTon: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const amount = req.body.amount
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            if (user.bonusTon < 0.1) {
                return res.status(400).send({
                    message: "Accumulate above 0.1 ton to withdraw"
                });
            }
            if (!user.address) {
                return res.status(400).send({
                    message: "Connect your wallet first"
                });
            }
            if (amount > user.bonusTon) {
                return res.status(400).send({
                    message: "Exceed ton balance"
                });
            }
            const mnemonic = process.env.MNEMONIC || ""
            const mnemonicArray = mnemonic.split(" ");

            let { publicKey, secretKey } = await mnemonicToWalletKey(mnemonicArray);
            publicKey = Buffer.from(publicKey);
            secretKey = Buffer.from(secretKey);

            const wallet = WalletContractV4.create({ publicKey, workchain: 0 })
            const client = new TonClient({
                endpoint: TON_CENTER_RPC,
                apiKey: process.env.API_KEY
            });
            const balance = await client.getBalance(wallet.address);
            if (Number(amount) * 10**9 > balance) {
                return res.status(400).send({
                    message: "Connect admin to ask for support"
                });
            }
            const walletContract = client.open(wallet);
            const seqno = await walletContract.getSeqno();
            await walletContract.sendTransfer({
                sendMode: 1,
                seqno: seqno,
                secretKey,
                messages: [
                    internal({
                        to: user.address,
                        value: amount, // 0.05 TON
                        bounce: false,
                    })
                ]
            });

            // wait until confirmed
            let currentSeqno = seqno;
            while (currentSeqno == seqno) {
                console.log("waiting for transaction to confirm...");
                await sleep(1500);
                currentSeqno = await walletContract.getSeqno();
            }

            await TxOnchain.create({
                userId: _id,
                tx: "null",
                action: "withdraw",
                amount: amount
            })

            user = await User.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(_id) }, {
                bonusTon: ((user.bonusTon*10**9 - amount*10**9)/(10**9)).toFixed(9)
            }, {
                new: true
            })

            return res.status(200).send({
                data: {
                    user
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGrantAdmin: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const address = req.body.address

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(400).send({
                message: "invalid call"
            });

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                role: "admin",
            })

            await User.findOneAndUpdate({
                address: address
            }, {
                role: "admin",
            })
            return res.status(200).send({
                data: "success"
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}

async function checkDailyAttendance(userId: string) {
    let da = await DailyAttendence.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (da && da.createdAt > today) {
        return true;
    } else {
        return false;
    }
}

async function checkYesterdayAttendance(userId: string) {
    var startDay = new Date();
    startDay.setHours(0, 0, 0, 0)
    startDay.setDate(startDay.getDate() - 1)

    var endDay = new Date();
    endDay.setHours(23, 59, 59, 999);
    endDay.setDate(endDay.getDate() - 1)

    let badge = await DailyAttendence.find({
        "userId": new mongoose.Types.ObjectId(userId),
        "createdAt": { $lt: endDay, $gt: startDay }
    })

    if (badge[0] != null) {
        return true;
    } else {
        return false;
    }
}

export async function updatePointForRefUser(_id: string, newPonts: number) {
    let refUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
    await User.findOneAndUpdate({
        _id: new mongoose.Types.ObjectId(_id)
    }, {
        points: refUser.points + (newPonts * SHARE_REF) / 100,
    })
}

export async function getNftAddress(collectionAddress: Address, itemIndex: number) {
    const client = new TonClient({
        endpoint: TON_CENTER_RPC,
        apiKey: process.env.API_KEY
    });
    let response = await client.runMethod(
        collectionAddress,
        "get_nft_address_by_index",
        [{ type: "int", value: BigInt(itemIndex) }]
    );
    return response.stack.readAddress();
}

export async function getCurrentRank(id: string) {
    const allUsers = await User.find({ role: "user" }).sort({ points: -1 });
    let userRank = allUsers.findIndex((u: any, idx: any) => {
        return u._id.equals(new mongoose.Types.ObjectId(id))
    }) + 1;
    return userRank
}