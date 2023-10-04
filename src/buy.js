"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
require('dotenv').config();
const fs = require('fs');
const idl = JSON.parse(fs.readFileSync("./spider/src/idl.json", "utf8"));
const programId = new anchor.web3.PublicKey('SVBzw5fZRY9iNRwy5JczFYni2X9aDqur6HhAP1CXX7T');
let connection = new web3_js_1.Connection(process.env.ANCHOR_PROVIDER_URL);
const user = web3_js_1.Keypair.fromSecretKey(bytes_1.bs58.decode(process.env.ANCHOR_WALLET));
const provider = new anchor.AnchorProvider(connection, new nodewallet_1.default(user), {});
const program = new anchor.Program(idl, programId, provider);
const token = new web3_js_1.PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
const CONTRACT_SEED = 'contract';
const GAME_USER_SEED = 'gameuser';
const VERSION = 1;
const versionSeed = new anchor.BN(VERSION).toBuffer('le', 1);
const getGameEnd = (gameIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const contractPdaAddress = findPdaAddressByStringSeeds([CONTRACT_SEED], versionSeed);
    const data = yield program.account.contract.fetch(contractPdaAddress);
    return Number(data.games[gameIndex].blocktimeEnd.toString());
});
const buy = (user, gameIndex, qty) => __awaiter(void 0, void 0, void 0, function* () {
    const contractPdaAddress = findPdaAddressByStringSeeds([CONTRACT_SEED], versionSeed);
    const gameUserPdaAddress = findGameUserPdaAddress(GAME_USER_SEED, gameIndex, user.publicKey);
    const rafflePdaAddress = findGameUserPdaAddress('raffle', gameIndex);
    const contractTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, user, token, contractPdaAddress, true);
    let latestBlockhash = yield connection.getLatestBlockhash('finalized');
    const atas = yield connection.getTokenAccountsByOwner(user.publicKey, { mint: token });
    const ata = atas.value[0].pubkey;
    for (var i = 0; i < gameIndex; i++) {
        try {
            const gameUserPdaAddress = findGameUserPdaAddress(GAME_USER_SEED, i, user.publicKey);
            const contractTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, user, token, contractPdaAddress, true);
            const balance = yield (yield connection.getTokenAccountBalance(ata)).value.uiAmount;
            if (balance > 0) {
                const tx = yield program.methods
                    .claim(i, VERSION)
                    .accounts({
                    authority: user.publicKey,
                    contract: contractPdaAddress,
                    gameUser: gameUserPdaAddress,
                    contractTokenAccount: contractTokenAccount.address,
                    claimTokenAccount: ata,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: web3_js_1.SystemProgram.programId,
                })
                    .rpc();
                console.log(tx);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    const ix = yield program.methods
        .buy(gameIndex, qty, VERSION)
        .accounts({
        signer: user.publicKey,
        contract: contractPdaAddress,
        contractTokenAccount: contractTokenAccount.address,
        gameUser: gameUserPdaAddress,
        buyerTokenAccount: ata,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        raffle: rafflePdaAddress,
        instructionSysvarAccount: new web3_js_1.PublicKey('Sysvar1nstructions1111111111111111111111111'),
        systemProgram: web3_js_1.SystemProgram.programId,
    })
        .remainingAccounts([
        { pubkey: new web3_js_1.PublicKey('68Cj4MgS3KgRMwfKPbrPVekBNijNNg27Pu8F3bCRG2rX'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('F8FqZuUKfoy58aHLW6bfeEhfW9sTtJyqFTqnxVmGZ6dU'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('76JQzVkqHsWWXA3z4WvzzwnxVD4M1tFmFfp4NhnfcrUH'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('9dKYKpinYRdC21CYqAW2mwEpZuPwBN6wkoswsvpHXioA'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('86C3VW44St7Nrgd3vAkwJaQuFZWYWmKCr97sJHrHfEm5'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('DveZWxw2nBDSNdqPmUmZMaxniqobWkTZdBBjvQaE2Bjx'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('EefQxy3SUAHWN7bURnMZzXXyp3BNaD73QmaMn7Do1sAc'), isWritable: true, isSigner: false },
        { pubkey: new web3_js_1.PublicKey('FrPSjSDWsRth6euNiaGAkzv6cYHgQysbWS9xMgkQcHXk'), isWritable: true, isSigner: false }
    ])
        .signers([user])
        .instruction();
    const memo = Buffer.from(user.publicKey.toBase58() + '-0-1-1');
    const memoInstruction = new web3_js_1.TransactionInstruction({
        keys: [
            { pubkey: user.publicKey, isSigner: true, isWritable: true },
        ],
        data: memo,
        programId: new web3_js_1.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    });
    const tx = new web3_js_1.Transaction().add(ix).add(memoInstruction);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = user.publicKey;
    const sig = yield program.provider.sendAndConfirm(tx);
    yield connection.confirmTransaction({
        signature: sig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    });
    console.log(sig);
    return sig;
});
const findPdaAddressByStringSeeds = (seeds, version) => {
    const seedBuffers = seeds.map((seedString) => {
        return Buffer.from(anchor.utils.bytes.utf8.encode(seedString));
    });
    seedBuffers.push(version);
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(seedBuffers, new anchor.web3.PublicKey(programId.toString()));
    const pdaAddress = new anchor.web3.PublicKey(pda);
    return pdaAddress;
};
const findGameUserPdaAddress = (stringSeed, gameIndex, user) => {
    const gameUserSeed = Buffer.from(anchor.utils.bytes.utf8.encode(stringSeed));
    const gameIndexSeed = new anchor.BN(gameIndex).toBuffer('le', 4);
    const userSeed = user != undefined ? user.toBuffer() : undefined;
    if (userSeed != undefined) {
        const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync([gameUserSeed, gameIndexSeed, userSeed, versionSeed], new anchor.web3.PublicKey(programId.toString()));
        console.log(`Bump: `, bump);
        console.log(`PDA: `, pda.toString());
        return pda;
    }
    else {
        const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync([gameUserSeed, gameIndexSeed, versionSeed], new anchor.web3.PublicKey(programId.toString()));
        console.log(`Bump: `, bump);
        console.log(`PDA: `, pda.toString());
        return pda;
    }
};
exports.default = { getGameEnd, buy };
