import { useState } from 'react';
import { useTransactionStore } from './stores/transactionStore';
import { ChainSelector } from './components/ChainSelector';
import { QuoteResult } from './components/QuoteResult';
import { WalletConnector } from './components/WalletConnector';
import { TransactionHistory } from './components/TransactionHistory';
import { AnimatedGradientBackdrop } from './components/AnimatedGradientBackdrop';
import { getBridgeTokens } from './utils/chains';
import { serializeForPersist } from './utils/serialize';
import type { QuoteResult as QuoteResultType, Transaction } from './types';
import { useWallet } from './hooks/useWallet';
import Big from 'big.js';
import './App.css';
import type { TokenConfig, WalletConfig } from '@stableflow/core';
import { Csl, usdt0Chains } from '@stableflow/core';
import { BridgeSFA, getQuoteModes, type GetAllQuoteParams } from '@stableflow/bridges';
import useWalletsStore from './stores/use-wallets';
import { useSwitchChain } from 'wagmi';

// Updated on 2026-07-03
const prices: Record<string, string> = {
  "$GOOB": "0.000000155665359068",
  "DODO": "0.01861688",
  "BSW": "0.00033468",
  "BAL": "0.090716",
  "WETH-5000": "1714.1",
  "AXL": "0.04296849",
  "USX": "0.399834",
  "hyUSD": "1.16",
  "LEET": "0",
  "BMX": "0.299149",
  "AUSD": "0.999762",
  "USDbC": "1",
  "MOG": "0.000000113228",
  "sUSD": "0.231948",
  "OCEAN": "0.114626",
  "ODIN": "0.02152682",
  "PREMIA": "0.01656041",
  "cbETH": "1945.63",
  "BURR": "0.00050868",
  "W3N": "0.000000000015367",
  "USD0": "0.998537",
  "POLLEN": "0.00052325",
  "KIM": "0.00001157",
  "USDS": "0.999702",
  "oETH": "1719.76",
  "BERAMO": "0.00000788",
  "WETH-169": "1713.99",
  "LINK": "7.77",
  "PNG": "0.02220342",
  "XAUt0": "4162.24",
  "USDz": "0.977455",
  "SNX": "0.231707",
  "SOULS": "0.00001212",
  "MOON": "0.00353861",
  "IONX": "0.00007161",
  "BLADE": "0.00034512",
  "EURe": "1.14",
  "AMPL": "1.28",
  "stBTC": "60174",
  "SUSHI": "0.162196",
  "COQ": "0.000000078968",
  "MATIC": "0",
  "REF": "0.04528015",
  "PNP": "0.16474",
  "mBTC": "74096",
  "RDNT": "0.00050421",
  "AGVE": "30.44",
  "ylrsETH": "3079.6160814014",
  "WMATIC": "0.073322",
  "APE": "0.145241",
  "BERA": "0.217687",
  "USDV": "0.376859",
  "BNBx": "622.67",
  "rUSD-OT": "1.047381779",
  "AIBERA": "0.00027292",
  "MINU": "0.00005385",
  "stEUR": "1.22",
  "MVX": "0.02390334",
  "BNB": "561.41",
  "BOME": "0.00043085",
  "WAIFU": "0.0003623",
  "PENDLE": "1.5",
  "ETH": "1716.01",
  "KUMA": "0.000000031131",
  "MUSD": "0.00000642",
  "sUSDa": "0.763911",
  "iUSD": "0.320035",
  "FXS": "0.246662",
  "OP": "0.101153",
  "SWPR": "0.00552081",
  "BABAL": "0.0000001009325126",
  "SMOL": "0.000000215272",
  "bnUSD": "0.998779",
  "BXBT": "0.000000188641777153",
  "RBC": "0.00354015",
  "m.USDT": "0.998793",
  "SLIZ": "0.0000056",
  "LAB": "0.138286",
  "BASE": "0.000000810224",
  "ZTX": "0.00026143",
  "POL": "0.073296",
  "MAI": "0.992916",
  "OOGA": "0.00112086",
  "pufETH": "1847.96",
  "USDbr": "0.9074701848957403",
  "ARB": "0.078038",
  "MANTE": "0.00000671",
  "ITP": "0.00432499",
  "pookie": "0.000000540994811782",
  "XFIT": "0.00247488",
  "STONE": "1820.95",
  "VRTX": "0.00006089",
  "BEAM": "0.00142551",
  "HOLD": "0.244516",
  "rETH": "2001.9",
  "frxUSD": "0.999854",
  "CROAK": "0.0000874",
  "APTR": "0.00001146",
  "BAG": "0.00001163",
  "ASTER": "0.637327",
  "waBTC": "74657.5074637813",
  "STC": "0.00000107",
  "uniETH": "1927.13",
  "FLY": "0.0001207",
  "WMNT": "0.439055",
  "ANDY": "0.00216407",
  "PRY": "0.00031715",
  "rswETH": "1814.83",
  "sUSDe": "1.24",
  "oBERO": "0.00353069420415943",
  "bsdETH": "1849.07",
  "LEND": "0.00031962",
  "XAI": "0.00728592",
  "LVC": "0.00005869",
  "ANIME": "0.00271307",
  "CEEK": "0.00270322",
  "MOZ": "0.00038455",
  "RETRO": "0.00042346",
  "DETH": "149.38",
  "sDAI": "1.25",
  "YDF": "0.00001635",
  "JONES": "0.097596",
  "SWEAT": "0.00051744",
  "iZi": "0.00143035",
  "RNT": "0.299614",
  "BYTE": "0.04847052",
  "AVAX": "6.83",
  "EUROs": "0.216652",
  "sNECT": "1.0084431148",
  "USDT0": "0.998954",
  "APEX": "0.292349",
  "SEI": "0.04929808",
  "SEAM": "0.00612077",
  "WETH-137": "1714.88",
  "RAM": "0.0002266",
  "CELO": "0.063407",
  "WINR": "0.00098989",
  "WBNB": "561.21",
  "stMATIC": "0.084268",
  "Boop": "0.00000266",
  "WXDAI": "1.003",
  "VALAS": "0.00007622",
  "AURORA": "0.02491652",
  "FPIS": "0.084623",
  "SPELL": "0.00009012",
  "ASTR": "0.0051121",
  "SCROLLY": "0.000000084876",
  "ENKI": "0.166859",
  "gUSDC": "1.3",
  "GG": "0.00009176",
  "GRAI": "0.659533",
  "METIS": "2.8",
  "LORE": "0.00006632614021",
  "eUSD": "0.997745",
  "slisBNB": "580.66",
  "Neo": "0.000000180532013221",
  "OFF": "0.00467975",
  "GODL": "0.000366506273523988",
  "CHRP": "0.00009094",
  "CEUR": "1.14",
  "XRP": "1.1",
  "WETH-1088": "1720.26",
  "m.USDC": "0.999869",
  "SIS": "0.02041922",
  "eBTC": "61437",
  "CLEO": "5.66",
  "BYUSD": "0.997747056537439",
  "SUI": "0.739456",
  "rsETH": "1839.99",
  "WETH-10": "1710.25",
  "WETH-43114": "1713.81",
  "AAVE": "85.97",
  "LYNX": "0.00050602",
  "NILE": "0.00410702",
  "VS": "0.00012562",
  "DUSD": "1.026",
  "TROVE": "0.00126461",
  "HIGHER": "0.0001669",
  "DAI.e": "0.999763",
  "TAROT": "0.03092274",
  "DOGE": "0.075207",
  "SCRIBES": "0",
  "WETH.e": "3317.11",
  "REX": "0.00672546",
  "ION": "0.00002624",
  "USD₮0": "0.998954",
  "USDR": "0.462689",
  "USDD": "0.998853",
  "MaticX": "0.086987",
  "SpaceFi": "0.00740392",
  "COW": "0.147751",
  "KIMBO": "0.00000219",
  "KABOSUCHAN": "0.000000000141868",
  "CHP": "0.03678833",
  "NEAR": "1.95",
  "PEARL": "0.02265494",
  "WETH-34443": "1688.06",
  "WETH-56": "1715.97",
  "SolvBTC": "61140",
  "PEPE": "0.00000247",
  "PRIME": "0.082663",
  "sfrxETH": "1994.31",
  "vMANTA": "0.783147",
  "axlUSDC": "1",
  "VC": "0.00027032",
  "D2": "0.00998926",
  "iBERA": "0.225984",
  "RPL": "1.67",
  "Decentralized USD": "0.085713",
  "agEUR": "1.15",
  "BTCB": "61707",
  "RDPX": "0.473145",
  "WETH-534352": "1714.51",
  "ylBTCLST": "114833.494402954",
  "FPI": "1.14",
  "zkUSD": "0.00962593",
  "FRAX": "0.989538",
  "STAR": "0.00137253",
  "HNY": "0.873585",
  "EQB": "0.03211797",
  "PEAK": "0.00005937",
  "WETH": "1715.38",
  "OLE": "0.00086624",
  "GAMMA": "0.00050094",
  "WPC": "0.00001191",
  "BRRR": "0.00081852",
  "FBTC": "62077",
  "rUSD": "0.998881",
  "THALES": "0.126193",
  "PEAS": "0.564048",
  "ankrETH": "2091.3",
  "ARTIO": "0.000000046009545452",
  "ECLIP": "0.00219057",
  "WETH-1": "1715.38",
  "3BC": "0.000017418038608058",
  "MOE": "0.00683234",
  "ETHFI": "0.336104",
  "PAC": "0.00015183",
  "YOLO": "0.0000251",
  "uniBTC-OT": "115462.593890507",
  "staBAL3": "1.03",
  "MAIA": "0.174527",
  "MODE": "0.00004958",
  "CRV": "0.204946",
  "EARLY": "0.0000402",
  "KAP": "0.00017041",
  "TIA": "0.00234246",
  "OMNI": "0.00000473",
  "WSTETH": "2127.42",
  "NAV": "0.00136347",
  "$HOGE": "0.000000015772",
  "VELO": "0.02137836",
  "ceBUSD": "0.998017",
  "CASH": "0.872195",
  "WELL": "0.00365854",
  "WifSock": "0.000000323751268905",
  "MIM": "0.13458",
  "SPACE": "0.00740392",
  "SHRAP": "0.00038991",
  "QUICK": "0.00747482",
  "axlUSDT": "0.996829",
  "GUSD": "0.998314",
  "OKB": "80.35",
  "BERATARDIO": "0.00000172008927827",
  "ICL": "0.0081837",
  "HAPI": "0.227324",
  "uniBTC": "60780",
  "BCat": "0.00034756",
  "WETH-59144": "1715.86",
  "USDT.e": "0.998793",
  "BEEF": "0.000000524817",
  "ADA": "0.165107",
  "suUSD": "0.948137",
  "LODE": "0.00362093",
  "AURA": "0.01173421",
  "USDC": "0.999869",
  "UNI": "3.2",
  "mpDAO": "0.00544238",
  "TITANS": "0.00000824",
  "RDP": "0.03642701",
  "PSM": "0.000000984068",
  "USDC.e": "0.999586",
  "HUM": "0.00002729",
  "pumpBTC.bera": "74620.3136274856",
  "BTC.b": "61673",
  "RCKT": "0.04581254",
  "gOHM": "4510.9",
  "Matic": "0",
  "SKY": "0.01499354",
  "frxETH": "1714.38",
  "AI": "0.02131098",
  "THE": "0.058601",
  "BSWAP": "0.00415662",
  "JUICE": "0.00001378",
  "DONUT": "0.00029559",
  "WETH-1101": "1675.32",
  "BINU": "0.000000367153",
  "NUON": "0.935164",
  "HERA": "1.42",
  "HENLO": "0.00000145144817577",
  "JOE": "0.02972531",
  "LOCKS": "0.0112413208479958",
  "ZETA": "0.03699104",
  "NECT": "0.943328",
  "wstETH": "2123.69",
  "LUSD": "1.007",
  "bm": "0.00005129",
  "BERAFI": "0.00000614",
  "artMETIS": "2.79",
  "IB": "0.069304",
  "suETH": "0",
  "POOL": "0.0360025",
  "DOLO": "0.02340851",
  "ORBIT": "0.00047645",
  "CAKE": "1.37",
  "GOVI": "0.00116627",
  "BPT": "0.00151687",
  "bdawg": "0.000000337846845421",
  "DPX": "0.717025",
  "SX": "0.01345921",
  "MAGIC": "0.04280859",
  "FJO": "0.00822347",
  "SPARTA": "0.00153668",
  "WBTC": "61714",
  "USDe": "0.998453",
  "velocore": "0.00005869",
  "BBLAST": "0.000000144572813051",
  "SBF": "0.00040499",
  "weETH": "1883.44",
  "ceBNB": "561.41",
  "TUSD": "0.997783",
  "inrETH": "2877.55",
  "GBPe": "1.33",
  "MELANIA": "0.079005",
  "ultraETHs": "3456.67",
  "SOL": "81.11",
  "mstETH": "900.6",
  "AZT": "0.000006852391578202",
  "RF": "0.00053732",
  "BUSD": "0.998017",
  "KUBERA": "0.00000000005349904",
  "MNT": "0.439095",
  "RAMEN": "0.001185520294102997",
  "usdc.e": "0.999586",
  "SAND": "0.04970992",
  "GNS": "0.629749",
  "LBTC": "61971",
  "CHR": "0.00062035",
  "DROPS": "0.00112172",
  "USDT": "0.998793",
  "mUSD": "1.16",
  "DeFAI": "0.00688525",
  "USDB": "1.004",
  "BEBE": "0.000002774235958",
  "ALOT": "0.02753525",
  "pxETH": "1711",
  "ZED": "0.00009195",
  "GNO": "104.59",
  "DACKIE": "0.00004528",
  "wrsETH": "1839.99",
  "STG": "0.157044",
  "SolvBTC.m": "80728",
  "FTW": "0.564187",
  "coin": "0.00037352",
  "AURY": "0.02512922",
  "GMX": "5.96",
  "HERMES": "0.00024596",
  "MNU": "0.00001885",
  "BOW": "0.0000007265589409",
  "BONGA": "0.000002362719517156",
  "FLR": "0.00667476",
  "USDa": "0.982446",
  "USDFI": "0.273248",
  "STRDY": "0.0079597",
  "MENDI": "0.0003639",
  "LPUSS": "0.00001215",
  "HAN": "0.00015984",
  "GSWIFT": "0.00039444",
  "REZ": "0.00305253",
  "PHAR": "57.7",
  "ankrBNB": "619.7",
  "ACX": "0.04265796",
  "mwstETH-WPUNKS:20": "2831.48",
  "SYNTH": "0.04673201",
  "beraETH": "1800.85",
  "crvUSD": "0.999394",
  "MOCHAD": "0.000000000658988",
  "PURGE": "0.000901",
  "QI": "0.00120256",
  "BANANA": "0.000000014026",
  "LGNS": "1.93",
  "wBLT": "0.78346",
  "DMT": "3.53",
  "LBGT": "0.206607",
  "FINGER": "0.000000013286",
  "FCTR": "0.01482179",
  "BRLY": "0.0000014",
  "BRETT": "0.00541252",
  "BALD": "0.00898386",
  "instETH": "4226.97",
  "ORN": "0.0244115",
  "YEET": "0.00007007",
  "Bonsai": "0.00003734",
  "BREAD": "0.266998",
  "GRAIL": "49.38",
  "XVS": "2.53",
  "XDAI": "0.99953",
  "MPS": "5.68",
  "WETH-81457": "1713.94",
  "USDY": "1.14",
  "EURA": "1.15",
  "Lqdr": "0.00935876",
  "ELK": "0.00859956",
  "CBR": "0.00005296",
  "AERO": "0.505864",
  "GLORY": "0.00006434",
  "TURBO": "0.00088631",
  "BLACKDRAGON": "0.000000006607",
  "KNC": "0.110671",
  "CREAM": "0.473861",
  "DAI": "0.999763",
  "WMETIS": "2.79",
  "WBERA": "0.217803",
  "ZERO": "0.000000590758",
  "wUSDR": "0.471393",
  "FOXY": "0.0000785",
  "NOME": "0.00153762127871292",
  "BIXBT": "0.00001109",
  "WETH-8453": "1715.81",
  "MANTA": "0.062024",
  "stkBNB": "588.24",
  "SHIB": "0.00000428",
  "WAVAX": "6.83",
  "HYPE": "0.00475024",
  "OHM": "16.61",
  "SolvBTC.BBN": "72034",
  "PLUG": "0.000008723858451078",
  "XSGD": "0.774186",
  "RAIN": "4.62",
  "mETH": "1874.59",
  "HZN": "0.00017515",
  "M-BTC": "61024",
  "DEVBEAR": "0.000001942821033",
  "WIF": "0.173305",
  "1INCH": "0.070965",
  "HEFE": "0.00054937",
  "MIA": "0.00478536",
  "BTC": "61728",
  "USDs": "0.997496",
  "SHITZU": "0.00085698",
  "BEETS": "0.00541475",
  "stBGT": "0.198799228501096",
  "ABOND": "0.0004929",
  "yBGT": "2.64",
  "brBTC": "71364",
  "INJ": "4.77",
  "YEL": "0.00015738",
  "ezETH": "1846.32",
  "PUMP": "0.00430118",
  "WETH-324": "1713.38",
  "BERO": "1.0479659008489866",
  "APT": "0.616997",
  "BSC-USD": "0.00373536",
  "BITCOIN": "0.01358",
  "loreUSD": "2.4513753073",
  "WETH-100": "1715.85",
  "WETH-42161": "1715.93",
  "eETH": "1716.55",
  "HIM": "0.00000271",
  "RING": "0.083508",
  "PEAR": "0.02020378",
  "TON": "1.67",
  "$WAI": "0.21248",
  "TRX": "0.318631",
  "iBGT": "0.216635",
  "BBOT": "0.00039004",
  "stETH": "1715.54",
  "ATH": "0.00116856",
  "KALA": "0.089639",
  "SMD": "0.00040511",
  "mia-2d4b": "0.00003391",
  "wUSDM": "1.085",
  "CAT": "0.000000096053",
  "osETH": "1831.14",
  "LYRA": "0.00011933",
  "TRUMP": "1.72",
  "JANI": "0.00000133",
  "ZENF": "0.00139139",
  "BLAST": "0.00026401",
  "Lynex": "0.00050602",
  "LDO": "0.261058",
  "XPL": "0.099981",
  "GOLD": "0.852961",
  "HONEY": "0.998466",
  "ETHx": "1871.61",
  "BTCLUB": "0.000000244707738515",
  "COUCH": "0.000000128095345581",
  "wgBERA": "0.207295",
  "SLOTH": "0.000000230499545727",
  "WIZZ": "0.00007014",
  "LIQD": "2077.92",
  "MUTE": "0.00009199",
  "ZF": "0.00041247",
  "oriBGT": "2.07",
  "ylstETH": "2617.0345419217",
  "COMP": "16.62",
  "vASTR": "0.00729279",
  "SONNE": "0.00008564",
  "ylpumpBTC": "98950.5357351076",
  "BVM": "0.00083967",
  "ZEC": "436.8",
  "CVR": "0.134078",
  "DVF": "0.544063",
  "NETT": "0.009488",
  "EURC": "1.15",
  "BOBO": "0.00000024679337174",
  "ZK": "0.01065553",
  "PATCHS": "0.000000387839374876",
  "LSD": "0.00030257",
  "YES": "3.33",
  "XY": "0.01910364"
};

const bridgeTokens = getBridgeTokens();
const SLIPPAGE_PRESETS = [0.01, 0.05, 0.1, 0.5] as const;
const DEFAULT_SLIPPAGE = 0.05;
const MIN_SLIPPAGE = 0.01;
const MAX_SLIPPAGE = 1;

const normalizeSlippage = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const rounded = Math.round(parsed * 100) / 100;
  return Math.min(MAX_SLIPPAGE, Math.max(MIN_SLIPPAGE, rounded));
};

const formatSlippageInput = (value: number): string => value.toFixed(2);

function App() {
  const [fromToken, setFromToken] = useState<TokenConfig>();
  const [toToken, setToToken] = useState<TokenConfig>();

  const [amount, setAmount] = useState<string>('');
  const [slippageInput, setSlippageInput] = useState<string>(formatSlippageInput(DEFAULT_SLIPPAGE));
  const [toAddress, setToAddress] = useState<string>('');
  const [fromWalletAddress, setFromWalletAddress] = useState<string | null>(null);
  const [toWalletAddress, setToWalletAddress] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteResultType[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addTransaction } = useTransactionStore();
  const wallets = useWalletsStore();
  const { switchChainAsync } = useSwitchChain();
  const cs = new Csl(true);
  const csl = cs.log;

  const { wallet: fromWallet, switchNetwork } = useWallet(fromToken ?? null);
  const { wallet: evmWallet, address: evmAddress, connect: connectEVM, disconnect: disconnectEVM } = useWallet(usdt0Chains["arb"]);

  const recipient =
    (toAddress || toWalletAddress || fromWalletAddress || '').trim() || fromWalletAddress || '';

  const resetQuotes = () => {
    setQuotes([]);
    setSelectedQuote(null);
  };

  const handleSlippageChange = (value: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setSlippageInput(value);
    resetQuotes();
  };

  const handleSlippageBlur = () => {
    const normalizedSlippage = normalizeSlippage(slippageInput);
    if (normalizedSlippage === null) {
      setSlippageInput(formatSlippageInput(DEFAULT_SLIPPAGE));
      setError('Slippage must be between 0.01 and 1.');
      return;
    }
    setSlippageInput(formatSlippageInput(normalizedSlippage));
  };

  const handleSlippagePreset = (value: number) => {
    setSlippageInput(formatSlippageInput(value));
    setError(null);
    resetQuotes();
  };

  const handleGetQuote = async () => {
    const normalizedSlippage = normalizeSlippage(slippageInput);
    if (
      !fromToken ||
      !toToken ||
      !amount ||
      !fromWalletAddress ||
      !recipient ||
      !fromWallet?.wallet ||
      normalizedSlippage === null
    ) {
      if (normalizedSlippage === null) {
        setError('Slippage must be between 0.01 and 1.');
        return;
      }
      setError('Please fill in all required fields and connect from chain wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setQuotes([]);
    setSelectedQuote(null);

    try {
      const quoteRequest: GetAllQuoteParams = {
        dry: false,
        minInputAmount: '0.1',
        prices,
        fromToken: fromToken,
        toToken: toToken,
        wallet: fromWallet.wallet as WalletConfig,
        recipient,
        refundTo: fromWalletAddress,
        amountWei: Big(amount)
          .times(10 ** fromToken.decimals)
          .toFixed(0, 0),
        slippageTolerance: normalizedSlippage,
        oneclickParams: {
          appFees: [
            {
              recipient: 'stableflow.near',
              fee: 0,
            },
          ],
        },
        evmWallet: evmWallet?.wallet as WalletConfig,
        evmAddress: evmAddress ?? void 0,
      };

      const response = await BridgeSFA.getAllQuote(quoteRequest);

      console.log("quotes response: %o", response);

      if (response && Array.isArray(response)) {
        if (response.length === 0) {
          setError(`No valid quotes available.`);
        } else {
          setQuotes(response);
          const firstValid = response.find((q) => q.quote && !q.quote.errMsg);
          if (firstValid) {
            setSelectedQuote(firstValid);
          }
        }
      } else {
        setError('Invalid response format from quote service');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get quote';
      setError(message);
      console.error('Quote error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPermitSignature = async (quote: any) => {
    if (!quote || !quote?.needPermit) {
      return void 0;
    }

    const {
      permitToken,
      permitSpender,
      permitAmountWei,
      permitAdditionalData,
      quoteParam,
    } = quote;

    const evmWallet: any = wallets.evm.wallet;

    if (!evmWallet) {
      throw new Error("Permit wallet not connected");
    }

    await switchChainAsync({ chainId: permitToken.chainId! });

    const signature = await evmWallet?.signTypedData({
      fromToken: permitToken,
      amountWei: permitAmountWei,
      spender: permitSpender,
    });

    // After signing, need to switch back to the source chain
    if (quoteParam.fromToken.chainType === "evm") {
      await switchChainAsync({ chainId: quoteParam.fromToken.chainId! });
    }

    csl("transfer", "sky-600", "permit signature: %o", signature);

    const permitResult = {
      amount: signature.value,
      deadline: signature.deadline,
      nonce: signature.nonce,
      owner: signature.owner,
      r: signature.r,
      s: signature.s,
      v: signature.v,
      ...permitAdditionalData,
    };

    csl("transfer", "sky-600", "permit data: %o", permitResult);

    return permitResult;
  };

  const handleSubmitTransaction = async () => {
    if (!selectedQuote || !fromToken || !toToken || !fromWalletAddress || !fromWallet?.wallet) {
      setError('Please select a quote and ensure wallet is connected');
      return;
    }

    setLoading(true);
    setError(null);

    const quote = selectedQuote.quote;
    const wallet = fromWallet.wallet as {
      allowance?: (params: unknown) => Promise<{ allowance: string }>;
      approve?: (params: unknown) => Promise<{ success: boolean; message?: string }>;
    };

    const { isExactOutput } = getQuoteModes({
      quoteData: quote,
      bridgeStore: { quoteDataService: selectedQuote.serviceType },
    });

    let _amountWei = quote.quoteParam.amountWei;
    if (isExactOutput) {
      _amountWei = quote.quote?.minAmountIn;
    }

    try {
      const permitSignature = await getPermitSignature(quote);

      if (quote.needApprove && wallet.allowance && wallet.approve) {
        if (fromToken.chainName === 'Ethereum') {
          const allowanceResult = await wallet.allowance({
            contractAddress: quote.quoteParam.fromToken.contractAddress,
            spender: quote.approveSpender,
            amountWei: _amountWei,
            address: fromWalletAddress,
          });
          if (Big(allowanceResult.allowance || 0).gt(0)) {
            const approveRes = await wallet.approve({
              contractAddress: quote.quoteParam.fromToken.contractAddress,
              spender: quote.approveSpender,
              amountWei: '0',
              isDetails: true,
            });
            if (!approveRes.success) {
              throw new Error(approveRes.message);
            }
          }
        }

        const approveRes = await wallet.approve({
          contractAddress: quote.quoteParam.fromToken.contractAddress,
          spender: quote.approveSpender,
          amountWei: _amountWei,
          isDetails: true,
        });
        if (!approveRes.success) {
          throw new Error(approveRes.message);
        }
      }

      const txHash = await BridgeSFA.send(selectedQuote.serviceType, {
        wallet: fromWallet.wallet,
        quote,
        permitSignature,
      });

      const tx: Transaction = {
        id: txHash,
        fromToken: fromToken,
        toToken: toToken,
        fromChain: fromToken.chainName,
        toChain: toToken.chainName,
        txHash,
        toChainTxHash: '',
        amount,
        fromAddress: fromWalletAddress,
        toAddress: (toAddress || toWalletAddress || fromWalletAddress) as string,
        status: 'pending',
        timestamp: Date.now(),
        serviceType: selectedQuote.serviceType,
        depositAddress: quote.quote?.depositAddress,
        quote: serializeForPersist(quote),
      };

      addTransaction(tx);
      setAmount('');
      setQuotes([]);
      setSelectedQuote(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit transaction';
      setError(message);
      console.error('Transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [fromChainBalance, setFromChainBalance] = useState<string>('');
  const [fromChainBalanceLoading, setFromChainBalanceLoading] = useState(false);
  const getFromChainBalance = async (_fromChainConfig?: TokenConfig) => {
    setFromChainBalanceLoading(true);
    const cfg = _fromChainConfig || fromToken;
    const sdkWallet = fromWallet?.wallet as { getBalance?: (token: TokenConfig, account: string) => Promise<string> };
    if (!cfg || !fromWallet?.account || !sdkWallet?.getBalance) {
      setFromChainBalanceLoading(false);
      setFromChainBalance('');
      return;
    }
    try {
      const balance = await sdkWallet.getBalance(cfg, fromWallet.account);
      setFromChainBalance(
        Big(balance || 0)
          .div(10 ** cfg.decimals)
          .toFixed(cfg.decimals, 0)
      );
    } catch {
      setFromChainBalance('');
    }
    setFromChainBalanceLoading(false);
  };

  const amountLabel = fromToken?.symbol ? `Amount (${fromToken.symbol})` : 'Amount';

  return (
    <>
      <AnimatedGradientBackdrop />
      <div className="app">
        <header className="app-header">
          <div>
            <div className="quote-header">
              <img
                src="/logo-stableflow.svg"
                alt="StableFlow"
                className="logo"
              />
              {
                evmAddress ? (
                  <div className="flex items-center gap-2">
                    <div className="">{evmAddress.slice(0, 4)}...{evmAddress.slice(-6)}</div>
                    <button
                      type="button"
                      className="disconnect-button"
                      onClick={disconnectEVM}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="connect-button"
                    onClick={connectEVM}
                  >
                    Connect EVM Wallet
                  </button>
                )
              }
            </div>
            <h1>StableFlow Demo-Full</h1>
            <p>All-chain cross-chain bridge (EVM, Aptos, NEAR, Solana, Sui, TON, Tron)</p>
          </div>
        </header>

        <main className="app-main">
          <div className="bridge-form">
            <div className="form-section">
              <h2>From</h2>
              <ChainSelector
                label="From Chain"
                value={fromToken}
                tokens={bridgeTokens}
                placeholder="Select source chain"
                onChange={(_fromToken) => {
                  if (_fromToken?.chainType === 'evm') {
                    switchNetwork(_fromToken);
                  }
                  setFromToken(_fromToken);
                  void getFromChainBalance(_fromToken);
                }}
                excludeToken={toToken}
              />
              {fromToken && (
                <div className="quote-header">
                  <WalletConnector
                    chain={fromToken}
                    onAddressChange={(addr) => {
                      setFromWalletAddress(addr ?? null);
                      if (!addr) {
                        setFromChainBalance('');
                        setFromChainBalanceLoading(false);
                        setError(null);
                        setQuotes([]);
                        setSelectedQuote(null);
                      }
                    }}
                  />
                  <div className="wallet-connected">
                    <div>{fromChainBalanceLoading ? 'Loading...' : fromChainBalance}</div>
                    <button
                      type="button"
                      className="btn-remove"
                      style={{ background: '#667eea', opacity: fromChainBalanceLoading ? 0.5 : 1 }}
                      onClick={() => void getFromChainBalance()}
                      disabled={fromChainBalanceLoading}
                    >
                      Fetch Balance
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>To</h2>
              <ChainSelector
                label="To Chain"
                value={toToken}
                tokens={bridgeTokens}
                placeholder="Select destination chain"
                onChange={setToToken}
                excludeToken={fromToken}
              />
              <div className="to-address-input">
                <label>Recipient Address (optional)</label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Enter address or connect wallet"
                  className="input-address"
                />
              </div>
              {toToken && (
                <WalletConnector
                  chain={toToken}
                  onAddressChange={(addr) => setToWalletAddress(addr ?? null)}
                />
              )}
            </div>

            <div className="form-section">
              <label>{amountLabel}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-amount"
              />

              <div className="slippage-field">
                <label htmlFor="slippage-input">Slippage tolerance (%)</label>
                <div className="slippage-row">
                  <input
                    id="slippage-input"
                    type="number"
                    value={slippageInput}
                    onChange={(e) => handleSlippageChange(e.target.value)}
                    onBlur={handleSlippageBlur}
                    placeholder="0.05"
                    step="0.01"
                    min="0.01"
                    max="1"
                    className="input-amount"
                  />
                  <div className="slippage-presets">
                    {SLIPPAGE_PRESETS.map((preset) => {
                      const presetValue = formatSlippageInput(preset);
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`btn-slippage-preset${slippageInput === presetValue ? ' active' : ''}`}
                          onClick={() => handleSlippagePreset(preset)}
                        >
                          {presetValue}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message break-all">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => void handleGetQuote()}
                disabled={loading || !fromToken || !toToken || !amount || !fromWalletAddress}
                className="btn-primary"
              >
                {loading ? 'Getting Quote...' : 'Get Quote'}
              </button>
              {selectedQuote && (
                <>
                  <QuoteResult
                    toToken={toToken}
                    quotes={quotes}
                    onSelectQuote={setSelectedQuote}
                    selectedQuote={selectedQuote}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSubmitTransaction()}
                    disabled={loading || selectedQuote.quote?.errMsg}
                    className="btn-submit"
                  >
                    {
                      loading
                        ? 'Submitting...'
                        : selectedQuote.quote?.errMsg
                          ? selectedQuote.quote?.errMsg
                          : 'Submit Transaction'
                    }
                  </button>
                </>
              )}
            </div>
          </div>

          <TransactionHistory />
        </main>
      </div>
    </>
  );
}

export default App;
