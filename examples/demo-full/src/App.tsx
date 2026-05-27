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

// Updated on 2026-05-21
const prices: Record<string, string> = {
  "$GOOB": "0.00000048292867711",
  "DODO": "0.01534086",
  "BSW": "0.00172506",
  "BAL": "0.155238",
  "WETH-5000": "2159.41",
  "AXL": "0.053683",
  "USX": "0.528796",
  "hyUSD": "1.14",
  "LEET": "0",
  "BMX": "0.463308",
  "AUSD": "0.999831",
  "USDbC": "1.001",
  "MOG": "0.000000153861",
  "sUSD": "0.756101",
  "OCEAN": "0.12477",
  "ODIN": "0.02152682",
  "PREMIA": "0.059567",
  "cbETH": "2432.69",
  "BURR": "0.00050868",
  "W3N": "0.000000000015367",
  "USD0": "0.997628",
  "POLLEN": "0.0007309",
  "KIM": "0.00001157",
  "USDS": "1",
  "oETH": "2160.55",
  "BERAMO": "0.00003147",
  "WETH-169": "2160.41",
  "LINK": "9.24",
  "PNG": "0.02805036",
  "XAUt0": "4547.44",
  "USDz": "0.995681",
  "SNX": "0.302517",
  "SOULS": "0.00009386",
  "MOON": "0.02176",
  "IONX": "0.00017825",
  "BLADE": "0.00045148",
  "EURe": "1.16",
  "AMPL": "1.22",
  "stBTC": "70547",
  "SUSHI": "0.199688",
  "COQ": "0.000000099447",
  "MATIC": "0",
  "REF": "0.04183828",
  "PNP": "0.358663",
  "mBTC": "74096",
  "RDNT": "0.00478952",
  "AGVE": "30.68",
  "ylrsETH": "3079.6160814014",
  "WMATIC": "0.096339",
  "APE": "0.090211",
  "BERA": "0.502412",
  "USDV": "0.376859",
  "BNBx": "711.21",
  "rUSD-OT": "0.999547546371869",
  "AIBERA": "0.00027292",
  "MINU": "0.00005185",
  "stEUR": "1.25",
  "MVX": "0.02594855",
  "BNB": "641.95",
  "BOME": "0.00041778",
  "WAIFU": "0.0003623",
  "PENDLE": "1.24",
  "ETH": "2162.87",
  "KUMA": "0.000000052125",
  "MUSD": "0.00000642",
  "sUSDa": "0.893978",
  "iUSD": "0.489898",
  "FXS": "0.463054",
  "OP": "0.113763",
  "SWPR": "0.00809799",
  "BABAL": "0.000000311583900281",
  "SMOL": "0.000000291774",
  "bnUSD": "0.999494",
  "BXBT": "0.000000464020451194",
  "RBC": "0.00362432",
  "m.USDT": "0.999509",
  "SLIZ": "0.00000663",
  "LAB": "0.138286",
  "BASE": "0.00000115",
  "ZTX": "0.00026351",
  "POL": "0.096334",
  "MAI": "0.998758",
  "OOGA": "0.00223686",
  "pufETH": "2308.21",
  "USDbr": "0.9074701848957403",
  "ARB": "0.097816",
  "MANTE": "0.00000961",
  "ITP": "0.00422649",
  "pookie": "0.000001265227463727",
  "XFIT": "0.00298756",
  "STONE": "2282.21",
  "VRTX": "0.00009337",
  "BEAM": "0.00181081",
  "HOLD": "0.28203",
  "rETH": "2503.16",
  "frxUSD": "0.999607",
  "CROAK": "0.00006834",
  "APTR": "0.00000737",
  "BAG": "0.00001417",
  "waBTC": "76093.6870141686",
  "STC": "0.00000107",
  "uniETH": "2430.43",
  "FLY": "0.0001207",
  "WMNT": "0.715438",
  "ANDY": "0.00216407",
  "PRY": "0.00031715",
  "rswETH": "2299.06",
  "sUSDe": "1.22",
  "oBERO": "0.0352639380865453",
  "bsdETH": "2303.4",
  "LEND": "0.00371661",
  "XAI": "0.0101454",
  "LVC": "0.00005869",
  "CEEK": "0.00314758",
  "MOZ": "0.00038455",
  "RETRO": "0.00044363",
  "DETH": "149.38",
  "sDAI": "1.23",
  "YDF": "0.00002305",
  "JONES": "0.139166",
  "SWEAT": "0.00041123",
  "iZi": "0.00399409",
  "RNT": "0.157596",
  "BYTE": "0.04875946",
  "AVAX": "9.61",
  "EUROs": "0.720661",
  "sNECT": "1.0084431148",
  "USDT0": "0.999469",
  "APEX": "0.278111",
  "SEI": "0.060828",
  "SEAM": "0.105628",
  "WETH-137": "2160.14",
  "RAM": "0.00048064",
  "CELO": "0.079876",
  "WINR": "0.00130166",
  "WBNB": "642.12",
  "stMATIC": "0.109982",
  "Boop": "0.00000375",
  "WXDAI": "1.003",
  "VALAS": "0.00009001",
  "AURORA": "0.02894979",
  "FPIS": "0.111535",
  "SPELL": "0.00017192",
  "ASTR": "0.00831173",
  "SCROLLY": "0.000000100844",
  "ENKI": "0.168459",
  "gUSDC": "1.28",
  "GG": "0.00019909",
  "GRAI": "0.924628",
  "METIS": "3.11",
  "LORE": "0.00006632614021",
  "eUSD": "0.999292",
  "slisBNB": "663.77",
  "Neo": "0.0000009993865726",
  "OFF": "0.00588987",
  "GODL": "0.000727094873540576",
  "CHRP": "0.00010135",
  "CEUR": "1.16",
  "XRP": "1.41",
  "WETH-1088": "2154.82",
  "m.USDC": "0.99991",
  "SIS": "0.02482883",
  "eBTC": "70998",
  "CLEO": "5.66",
  "BYUSD": "1.0050438350705",
  "rsETH": "2307.24",
  "WETH-10": "2160.65",
  "WETH-43114": "2159.71",
  "AAVE": "112.05",
  "LYNX": "0.00110622",
  "NILE": "0.00989276",
  "VS": "0.00016427",
  "DUSD": "0.489715",
  "TROVE": "0.00164489",
  "HIGHER": "0.00026193",
  "DAI.e": "0.999941",
  "TAROT": "0.03348716",
  "DOGE": "0.095103",
  "SCRIBES": "0",
  "WETH.e": "3317.11",
  "REX": "0.02217923",
  "ION": "0.00004495",
  "USD₮0": "0.999469",
  "USDR": "0.295625",
  "USDD": "0.999706",
  "MaticX": "0.113653",
  "SpaceFi": "0.00740392",
  "COW": "0.20035",
  "KIMBO": "0.00000331",
  "KABOSUCHAN": "0.000000000141868",
  "CHP": "0.03678833",
  "NEAR": "1.29",
  "PEARL": "0.02265494",
  "WETH-34443": "2152.98",
  "WETH-56": "2161.44",
  "SolvBTC": "70724",
  "PEPE": "0.00000352",
  "PRIME": "0.08646",
  "sfrxETH": "2490.04",
  "vMANTA": "0.092451",
  "axlUSDC": "0.999686",
  "VC": "0.00052668",
  "D2": "0.01056514",
  "iBERA": "0.520138",
  "RPL": "1.75",
  "Decentralized USD": "0.085707",
  "agEUR": "1.16",
  "BTCB": "70809",
  "RDPX": "0.676486",
  "WETH-534352": "2161.03",
  "ylBTCLST": "114833.494402954",
  "FPI": "1.14",
  "zkUSD": "0.00962593",
  "FRAX": "0.991038",
  "STAR": "0.00149769",
  "HNY": "1.069",
  "EQB": "0.04425944",
  "PEAK": "0.00007062",
  "WETH": "2160.9",
  "OLE": "0.00122539",
  "GAMMA": "0.00351363",
  "WPC": "0.00001212",
  "BRRR": "0.0005971",
  "FBTC": "70694",
  "rUSD": "1.006",
  "THALES": "0.142429",
  "PEAS": "0.44855",
  "ankrETH": "2621.48",
  "ARTIO": "0.000000243799178291",
  "ECLIP": "0.00930787",
  "WETH-1": "2160.9",
  "3BC": "0.000026979780726929",
  "MOE": "0.01634634",
  "ETHFI": "0.53921",
  "PAC": "0.00019884",
  "YOLO": "0.00003471",
  "uniBTC-OT": "115462.593890507",
  "staBAL3": "1.03",
  "MAIA": "0.304928",
  "MODE": "0.00016089",
  "CRV": "0.23503",
  "EARLY": "0.0000402",
  "KAP": "0.00023437",
  "TIA": "0.00101543",
  "OMNI": "0.00000667",
  "WSTETH": "2658.77",
  "NAV": "0.00106668",
  "$HOGE": "0.000000022269",
  "VELO": "0.01490395",
  "ceBUSD": "1",
  "CASH": "0.872195",
  "WELL": "0.00454498",
  "WifSock": "0.00000043686117127",
  "MIM": "1.001",
  "SPACE": "0.00740392",
  "SHRAP": "0.00079604",
  "QUICK": "0.01030512",
  "axlUSDT": "0.994673",
  "GUSD": "0.999683",
  "OKB": "86.52",
  "BERATARDIO": "0.00000172008927827",
  "ICL": "0.0081837",
  "HAPI": "0.366526",
  "uniBTC": "70197",
  "BCat": "0.00039514",
  "WETH-59144": "2161.26",
  "USDT.e": "0.999509",
  "BEEF": "0.000000524817",
  "suUSD": "0.965073",
  "LODE": "0.00362093",
  "AURA": "0.02512011",
  "USDC": "0.99991",
  "UNI": "3.6",
  "mpDAO": "0.01218213",
  "TITANS": "0.00000824",
  "RDP": "0.0438175",
  "PSM": "0.00003529",
  "USDC.e": "1.001",
  "HUM": "0.00005263",
  "pumpBTC.bera": "74620.3136274856",
  "BTC.b": "70744",
  "RCKT": "0.04581254",
  "gOHM": "4311.74",
  "Matic": "0",
  "SKY": "0.071505",
  "frxETH": "2157.95",
  "AI": "0.02063672",
  "THE": "0.131366",
  "BSWAP": "0.00456846",
  "JUICE": "0.00001437",
  "DONUT": "0.00109589",
  "WETH-1101": "2150.11",
  "BINU": "0.000000367153",
  "NUON": "1.005",
  "HERA": "1.23",
  "HENLO": "0.00000145144817577",
  "JOE": "0.04206131",
  "LOCKS": "0.0114364526190085",
  "ZETA": "0.053262",
  "NECT": "0.996282",
  "wstETH": "2660.17",
  "LUSD": "1.025",
  "bm": "0.00002661",
  "BERAFI": "0.00000982",
  "artMETIS": "3.12",
  "IB": "0.172707",
  "suETH": "0",
  "POOL": "0.056192",
  "DOLO": "0.03351932",
  "ORBIT": "0.00047382",
  "CAKE": "1.42",
  "GOVI": "0.00206795",
  "BPT": "0.00235902",
  "bdawg": "0.000000789185350882",
  "DPX": "2.23",
  "SX": "0.01234888",
  "MAGIC": "0.061805",
  "FJO": "0.01175654",
  "SPARTA": "0.00162446",
  "WBTC": "70694",
  "USDe": "0.999327",
  "velocore": "0.00005869",
  "BBLAST": "0.000000341374328926",
  "SBF": "0.00027767",
  "weETH": "2357.32",
  "ceBNB": "641.95",
  "TUSD": "0.998103",
  "inrETH": "2877.55",
  "GBPe": "1.34",
  "MELANIA": "0.120919",
  "ultraETHs": "3456.67",
  "SOL": "91.7",
  "mstETH": "900.6",
  "AZT": "0.000009469451714641",
  "RF": "0.00053732",
  "BUSD": "1",
  "KUBERA": "0.00186777688200191",
  "MNT": "0.715782",
  "RAMEN": "0.001185520294102997",
  "usdc.e": "1.001",
  "SAND": "0.081579",
  "GNS": "0.795921",
  "LBTC": "70918",
  "CHR": "0.00061873",
  "DROPS": "0.00141281",
  "USDT": "0.999509",
  "mUSD": "1.17",
  "DeFAI": "0.00688525",
  "USDB": "0.999843",
  "BEBE": "0.000001138645820136",
  "ALOT": "0.0415194",
  "pxETH": "2149.4",
  "ZED": "0.00028921",
  "GNO": "128.75",
  "DACKIE": "0.00007461",
  "wrsETH": "2307.24",
  "STG": "0.198489",
  "SolvBTC.m": "80728",
  "FTW": "0.564187",
  "coin": "0.00048765",
  "AURY": "0.02845852",
  "GMX": "6.57",
  "HERMES": "0.00063947",
  "MNU": "0.00002663",
  "BOW": "0.0000007265589409",
  "BONGA": "0.000007573153050681",
  "FLR": "0.00805156",
  "USDa": "0.984613",
  "USDFI": "0.371814",
  "STRDY": "0.00971344",
  "MENDI": "0.00205276",
  "LPUSS": "0.00003193",
  "HAN": "0.00028045",
  "GSWIFT": "0.00092906",
  "REZ": "0.00336277",
  "PHAR": "104.38",
  "ankrBNB": "707.5",
  "ACX": "0.04260592",
  "mwstETH-WPUNKS:20": "2669.67",
  "SYNTH": "0.067332",
  "beraETH": "2259.83",
  "crvUSD": "0.999334",
  "MOCHAD": "0.000000000658988",
  "PURGE": "0.00141456",
  "QI": "0.00155531",
  "BANANA": "0.00000001999",
  "LGNS": "6.15",
  "wBLT": "0.95736",
  "DMT": "2.1",
  "LBGT": "0.491753",
  "FINGER": "0.000000016761",
  "FCTR": "0.0249516",
  "BRLY": "0.00001308",
  "BRETT": "0.00680566",
  "BALD": "0.01207691",
  "instETH": "4226.97",
  "ORN": "0.03158912",
  "YEET": "0.00043356",
  "Bonsai": "0.00004571",
  "BREAD": "0.62733",
  "GRAIL": "78.76",
  "XVS": "2.75",
  "XDAI": "0.999947",
  "MPS": "6.02",
  "WETH-81457": "2161.13",
  "USDY": "1.11",
  "EURA": "1.16",
  "Lqdr": "0.00935876",
  "ELK": "0.01304411",
  "CBR": "0.00005859",
  "AERO": "0.339293",
  "GLORY": "0.00006434",
  "TURBO": "0.00112483",
  "BLACKDRAGON": "0.000000007177",
  "KNC": "0.141241",
  "CREAM": "0.687872",
  "DAI": "0.999941",
  "WMETIS": "3.12",
  "WBERA": "0.501436",
  "ZERO": "0.000000823297",
  "wUSDR": "0.126226",
  "FOXY": "0.00016684",
  "NOME": "0.00153762127871292",
  "BIXBT": "0.00001109",
  "WETH-8453": "2161.43",
  "MANTA": "0.066537",
  "stkBNB": "682.98",
  "SHIB": "0.00000614",
  "WAVAX": "9.6",
  "HYPE": "0.00475024",
  "OHM": "15.96",
  "SolvBTC.BBN": "69281",
  "PLUG": "0.000029172642121108",
  "XSGD": "0.782035",
  "RAIN": "4.14",
  "mETH": "2338.55",
  "HZN": "0.00013073",
  "M-BTC": "70316",
  "DEVBEAR": "0.000001942821033",
  "WIF": "0.191306",
  "HEFE": "0.00036189",
  "MIA": "0.00478536",
  "BTC": "70864",
  "USDs": "0.998095",
  "SHITZU": "0.00070075",
  "BEETS": "0.00614261",
  "stBGT": "0.481582805638056",
  "ABOND": "0.00088524",
  "yBGT": "2.64",
  "brBTC": "71364",
  "INJ": "3.06",
  "YEL": "0.00020389",
  "ezETH": "2320.95",
  "PUMP": "0.00527078",
  "WETH-324": "2159.51",
  "BERO": "1.0479659008489866",
  "APT": "1.06",
  "BSC-USD": "0.00481002",
  "BITCOIN": "0.01844274",
  "loreUSD": "2.4513753073",
  "WETH-100": "2160.02",
  "WETH-42161": "2162.17",
  "eETH": "2160.76",
  "HIM": "0.00000416",
  "RING": "0.083508",
  "PEAR": "0.01926613",
  "TON": "1.33",
  "$WAI": "0.21248",
  "TRX": "0.307097",
  "iBGT": "0.512789",
  "BBOT": "0.00039004",
  "stETH": "2160.99",
  "ATH": "0.00116856",
  "KALA": "0.089639",
  "SMD": "0.00040511",
  "mia-2d4b": "0.00003391",
  "wUSDM": "1.085",
  "CAT": "0.000000119967",
  "osETH": "2295.14",
  "LYRA": "0.00016763",
  "TRUMP": "3.34",
  "JANI": "0.00000177",
  "ZENF": "0.00139139",
  "BLAST": "0.00049039",
  "Lynex": "0.00110622",
  "LDO": "0.299159",
  "XPL": "0.096962",
  "GOLD": "2.76",
  "HONEY": "0.997701",
  "ETHx": "2346.06",
  "BTCLUB": "0.000000721966620442",
  "COUCH": "0.000000243124234827",
  "wgBERA": "0.478091",
  "SLOTH": "0.000000230499545727",
  "WIZZ": "0.00023011",
  "LIQD": "2557.59",
  "MUTE": "0.00009921",
  "ZF": "0.00069912",
  "oriBGT": "2.07",
  "ylstETH": "2617.0345419217",
  "COMP": "19.58",
  "vASTR": "0.01107467",
  "SONNE": "0.00036228",
  "ylpumpBTC": "98950.5357351076",
  "BVM": "0.00094986",
  "ZEC": "238.42",
  "CVR": "0.134078",
  "DVF": "0.544063",
  "NETT": "0.00989583",
  "EURC": "1.16",
  "BOBO": "0.000000636445352776",
  "ZK": "0.0185558",
  "PATCHS": "0.000000624711797076",
  "LSD": "0.00038595",
  "YES": "3.01",
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
          .toString(),
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
                    fromToken={fromToken}
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
