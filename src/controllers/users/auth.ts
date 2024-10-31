const User = require("../../models/users.model")
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers';
require('dotenv').config()

export async function login (req: any, res: any) {
    try {
        // const signature = req.body.signature
        // const message = req.body.message
        const address = req.body.address
        // if (!signature || !message || !address) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Invalid input"
        //     })
        // }
        // //validation on email and password
        // const signerAddr = ethers.utils.verifyMessage(message, signature);
        // if (signerAddr.toLocaleLowerCase() != address) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Invalid signature"
        //     })
        // }

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