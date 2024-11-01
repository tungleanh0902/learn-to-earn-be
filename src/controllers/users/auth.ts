const User = require("../../models/users.model")
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers';
import {TonApiService} from "../../services/ton-api-service";
import {TonProofService} from "../../services/ton-proof-service";
require('dotenv').config()

export async function login (req: any, res: any) {
    try {
        const address = req.body.address
        const client = TonApiService.create(req.body.network);
        const service = new TonProofService();

        const isValid = await service.checkProof(req.body, (address) => client.getWalletPublicKey(address));
        if (!isValid) {
            return res.status(400).send({
                message: "Invalid proof"
            });
        }

        //check for registered User
        let user = await User.findOne({ address })

        if (!user) {
            // TODO: check nft onchain
            user = await User.create({
                address,
                points: 0,
                tickets: 0,
                role: "user"
            })
        }

        const payload = {
            id: user._id,
            role: user.role,
        }
        //now lets create a JWT token
        let token = jwt.sign(payload,
            process.env.JWT_SECRET || "",
            { expiresIn: "7d" }
        )
        user = user.toObject()
        user.token = token

        const options = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60),
            httpOnly: true  //It will make cookie not accessible on clinet side -> good way to keep hackers away
        }
        res.cookie(
            "token",
            token,
            options
        ).status(200).json({
            success: true,
            token,
            user,
            message: "Logged in Successfully✅"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Login failure⚠️ :" + error
        })
    }
}