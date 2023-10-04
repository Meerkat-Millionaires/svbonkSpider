import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import buy from './buy'
import * as anchor from "@coral-xyz/anchor";
const { Prism } = require("@prism-hq/prism-ag");
import fs from 'fs';
import { NATIVE_MINT } from '@solana/spl-token';

require('dotenv').config();

const CONTRACT_SEED = 'contract';
const GAME_USER_SEED = 'gameuser';
const VERSION = 1;
const versionSeed = new anchor.BN(VERSION).toBuffer('le', 1);

const token = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'); 
let connection = new Connection(process.env.ANCHOR_PROVIDER_URL as string)
const programId = new anchor.web3.PublicKey('SVBzw5fZRY9iNRwy5JczFYni2X9aDqur6HhAP1CXX7T');
const findPdaAddressByStringSeeds = (seeds:string[], version: Buffer) => {
    const seedBuffers = seeds.map((seedString) => {
        return Buffer.from(anchor.utils.bytes.utf8.encode(seedString));
    });
    seedBuffers.push(version);
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(seedBuffers, new anchor.web3.PublicKey(programId.toString()));
    const pdaAddress = new anchor.web3.PublicKey(pda);
    return pdaAddress;
}
const runOne = async ()=> {
    const keypairFile = fs.readFileSync(process.env.ANCHOR_WALLET);
    const user: Keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairFile.toString())));

    const idl = JSON.parse(fs.readFileSync("./src/idl.json", "utf8"));
    const programId = new anchor.web3.PublicKey('SVBzw5fZRY9iNRwy5JczFYni2X9aDqur6HhAP1CXX7T');
    const program = new anchor.Program(idl, programId);
    
    const contractPdaAddress = findPdaAddressByStringSeeds([CONTRACT_SEED], versionSeed);
    const data:any = await program.account.contract.fetch(contractPdaAddress);
    const currentGameIndex = data.activeGameIndex
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const gameEnd = await buy.getGameEnd(currentGameIndex);
    let seconds = gameEnd - currentTime;
    console.log(seconds)   
    if (true){//seconds <= 10){
        const atas = await connection.getTokenAccountsByOwner(user.publicKey, { mint: token });
        const ata = atas.value[0].pubkey;
        const balance = await (await connection.getTokenAccountBalance(ata)).value.uiAmount;
        if (balance < 6900000){
            await prism.loadRoutes(token, NATIVE_MINT);

            let routes = prism.getRoutes(6900000);
            let route = routes[0];
            const amount = (route.amountWithFees)
            if (amount != undefined){
                console.log(amount)
                
                await prism.loadRoutes(NATIVE_MINT, token);

                routes = prism.getRoutes(amount);
                route = routes[0];
                console.log(route)
                let result = await prism.swap(route);   
                console.log(result)
            }
        }
        buy.buy(user, currentGameIndex, 1);
    }
}
let prism: typeof Prism
const runService = async (milleseconds) => {
    const keypairFile = fs.readFileSync(process.env.ANCHOR_WALLET);
    const user: Keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(keypairFile.toString())));

    prism = await Prism.init({
        user,
        slippage: 99,
        connection: connection,
    });

    setInterval(runOne, milleseconds);
}

runService(5000);
// runOne();