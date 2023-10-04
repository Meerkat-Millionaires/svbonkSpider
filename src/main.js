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
exports.runService = exports.runOne = void 0;
const web3_js_1 = require("@solana/web3.js");
const buy_1 = __importDefault(require("./buy"));
const anchor = __importStar(require("@coral-xyz/anchor"));
const { Prism } = require("@prism-hq/prism-ag");
const fs = require('fs');
const spl_token_1 = require("@solana/spl-token");
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
require('dotenv').config();
const CONTRACT_SEED = 'contract';
const GAME_USER_SEED = 'gameuser';
const VERSION = 1;
const versionSeed = new anchor.BN(VERSION).toBuffer('le', 1);
const token = new web3_js_1.PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
let connection = new web3_js_1.Connection(process.env.ANCHOR_PROVIDER_URL);
const programId = new anchor.web3.PublicKey('SVBzw5fZRY9iNRwy5JczFYni2X9aDqur6HhAP1CXX7T');
const findPdaAddressByStringSeeds = (seeds, version) => {
    const seedBuffers = seeds.map((seedString) => {
        return Buffer.from(anchor.utils.bytes.utf8.encode(seedString));
    });
    seedBuffers.push(version);
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(seedBuffers, new anchor.web3.PublicKey(programId.toString()));
    const pdaAddress = new anchor.web3.PublicKey(pda);
    return pdaAddress;
};
const runOne = () => __awaiter(void 0, void 0, void 0, function* () {
    const keypairFile = bytes_1.bs58.decode(process.env.ANCHOR_WALLET);
    const user = web3_js_1.Keypair.fromSecretKey(keypairFile);
    const idl = JSON.parse(fs.readFileSync("./spider/src/idl.json", "utf8"));
    const programId = new anchor.web3.PublicKey('SVBzw5fZRY9iNRwy5JczFYni2X9aDqur6HhAP1CXX7T');
    const provider = new anchor.AnchorProvider(connection, new nodewallet_1.default(user), {});
    const program = new anchor.Program(idl, programId, provider);
    const contractPdaAddress = findPdaAddressByStringSeeds([CONTRACT_SEED], versionSeed);
    const data = yield program.account.contract.fetch(contractPdaAddress);
    const currentGameIndex = data.activeGameIndex;
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const gameEnd = yield buy_1.default.getGameEnd(currentGameIndex);
    let seconds = gameEnd - currentTime;
    console.log(seconds);
    if (true) { //seconds <= 10){
        prism = yield Prism.init({
            user,
            slippage: 99,
            connection: connection,
        });
        const atas = yield connection.getTokenAccountsByOwner(user.publicKey, { mint: token });
        const ata = atas.value[0].pubkey;
        const balance = yield (yield connection.getTokenAccountBalance(ata)).value.uiAmount;
        if (balance < 7100000) {
            yield prism.loadRoutes(token, spl_token_1.NATIVE_MINT);
            let routes = prism.getRoutes(7100000);
            let route = routes[0];
            const amount = (route.amountWithFees);
            if (amount != undefined) {
                console.log(amount);
                yield prism.loadRoutes(spl_token_1.NATIVE_MINT, token);
                routes = prism.getRoutes(amount);
                route = routes[0];
                console.log(route);
                try {
                    let result = yield prism.swap(route);
                    console.log(result);
                    const txId = result.txId;
                    yield connection.confirmTransaction(txId, "confirmed");
                }
                catch (err) {
                }
            }
        }
        const value = yield buy_1.default.buy(user, currentGameIndex, 1);
        return value || "false";
    }
});
exports.runOne = runOne;
let prism;
const runService = (milleseconds) => __awaiter(void 0, void 0, void 0, function* () {
    setInterval(exports.runOne, milleseconds);
});
exports.runService = runService;
// runOne();
