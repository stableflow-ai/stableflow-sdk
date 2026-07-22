import { ethers } from "ethers";
import { erc20Abi, Service, type TokenConfig } from "@stableflow/core";
import { evmRpcFallbackProvider } from "@stableflow/utils-evm";
import { getQuoteModes } from "./utils";

/**
 * Serializable, unsigned EVM transaction data.
 *
 * This is what an API-driven custody integrator (e.g. an MPC wallet such as
 * Fireblocks) receives. Stableflow builds the calldata; the integrator signs
 * and broadcasts it through their own infrastructure, then reports the
 * resulting hash back via `BridgeSFA.report`.
 */
export interface EvmTxData {
  chainId: number;
  from: string;
  to: string;
  /** Hex-encoded calldata. `0x` for a plain native-token transfer. */
  data: string;
  /** Native token amount in wei, as a decimal string. */
  value: string;
  /** Optional gas limit as a decimal string. */
  gasLimit?: string;
}

/**
 * EIP-712 typed data for an ERC20 `Permit`, returned unsigned so an external
 * signer (MPC/Fireblocks) can produce the signature. Nothing is signed or
 * verified inside the SDK for this payload.
 */
export interface PermitTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  values: {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: number;
  };
  deadline: number;
  nonce: number;
  token: string;
  spender: string;
  owner: string;
}

/**
 * Result of `BridgeSFA.buildTransaction`.
 *
 * Depending on the route, the integrator may need to: broadcast `approveTx`
 * (optionally `approveResetTx` first on Ethereum), sign `permitTypedData`,
 * and always broadcast the main `tx`. See `BridgeSFA.buildTransaction`.
 */
export interface BuildTransactionResult {
  chainId: number;
  from: string;
  /** Present when `quote.needApprove === true`. */
  approveTx?: EvmTxData;
  /**
   * Present when `quote.needApprove === true` and the source chain is Ethereum.
   * Some Ethereum tokens (e.g. USDT) require resetting the allowance to 0
   * before setting a new non-zero allowance.
   */
  approveResetTx?: EvmTxData;
  /** Present when `quote.needPermit === true`. Must be signed off-chain. */
  permitTypedData?: PermitTypedData;
  /** The main source-chain transaction to sign and broadcast. */
  tx: EvmTxData;
}

const OVERRIDE_KEYS = new Set([
  "value",
  "gasLimit",
  "gasPrice",
  "maxFeePerGas",
  "maxPriorityFeePerGas",
  "nonce",
  "from",
  "type",
  "accessList",
  "chainId",
  "customData",
  "blockTag",
]);

const toDecimalString = (v: unknown): string => {
  if (v === undefined || v === null) {
    return "0";
  }
  if (typeof v === "bigint") {
    return v.toString();
  }
  if (typeof v === "number") {
    return Math.trunc(v).toString();
  }
  return String(v);
};

/**
 * EVM-only guard. Non-EVM chains have very different transaction / message
 * shapes and are intentionally not supported by the API-driven flow yet.
 *
 * TODO(non-evm): implement per-chain unsigned transaction / message builders
 * for Solana, Tron, Sui, Aptos, Near and Ton so MPC integrators can sign them
 * through their own infrastructure.
 */
const assertEvm = (token: TokenConfig | undefined): void => {
  if (!token || (token as any).chainType !== "evm") {
    throw new Error("API-driven custody currently supports EVM chains only");
  }
};

const getSendAmountWei = (serviceType: Service, quote: any): string => {
  const { isExactOutput } = getQuoteModes({
    quoteData: quote,
    bridgeStore: { quoteDataService: serviceType },
  });
  if (isExactOutput) {
    // Use amountIn (with slippage buffer), not minAmountIn, so approve/deposit
    // amounts cannot fall short due to slippage; excess is refunded to refundTo.
    return quote?.quote?.amountIn;
  }
  return quote?.quoteParam?.amountWei;
};

/**
 * Encode an EVM `{ contract, method, param }` send payload (as produced by
 * `@stableflow/wallet-evm`) into serializable calldata WITHOUT a signer.
 *
 * The last element of `param` is treated as an ethers overrides object
 * (`{ value, gasLimit, ... }`) when all of its keys are known override keys.
 */
const encodeContractCall = (
  sendParam: { contract: any; method: string; param: any[] }
): Omit<EvmTxData, "chainId" | "from"> => {
  const { contract, method, param } = sendParam;

  if (!contract?.interface || contract?.target === undefined) {
    throw new Error("Invalid sendParam: missing contract interface/target");
  }

  const to = typeof contract.target === "string"
    ? contract.target
    : String(contract.target);

  let args: any[] = Array.isArray(param) ? param : [];
  let value: unknown;
  let gasLimit: unknown;

  if (args.length > 0) {
    const last = args[args.length - 1];
    const isOverride =
      last !== null &&
      typeof last === "object" &&
      !Array.isArray(last) &&
      Object.keys(last).length > 0 &&
      Object.keys(last).every((k) => OVERRIDE_KEYS.has(k));
    if (isOverride) {
      args = args.slice(0, -1);
      value = (last as any).value;
      gasLimit = (last as any).gasLimit;
    }
  }

  const data = contract.interface.encodeFunctionData(method, args);

  return {
    to,
    data,
    value: toDecimalString(value),
    gasLimit: gasLimit === undefined || gasLimit === null ? undefined : toDecimalString(gasLimit),
  };
};

/**
 * Build a plain token transfer (OneClick "simple" deposit path with no proxy):
 * ERC20 `transfer(depositAddress, amountWei)` or a native-token transfer.
 */
const buildTransferTx = (params: {
  chainId: number;
  from: string;
  fromToken: TokenConfig;
  depositAddress: string;
  amountWei: string;
}): EvmTxData => {
  const { chainId, from, fromToken, depositAddress, amountWei } = params;

  if (!depositAddress) {
    throw new Error("Quote has no depositAddress to build transfer transaction");
  }

  if (fromToken.contractAddress === "eth") {
    return {
      chainId,
      from,
      to: depositAddress,
      data: "0x",
      value: toDecimalString(amountWei),
    };
  }

  const iface = new ethers.Interface(erc20Abi as any);
  const data = iface.encodeFunctionData("transfer", [depositAddress, amountWei]);

  return {
    chainId,
    from,
    to: fromToken.contractAddress,
    data,
    value: "0",
  };
};

/**
 * Build the main unsigned source-chain transaction from a quote, mirroring the
 * branching in `BridgeSFA.send` but producing serializable calldata instead of
 * signing/broadcasting.
 */
export const buildSendTx = (serviceType: Service, quote: any): EvmTxData => {
  const fromToken: TokenConfig = quote?.quoteParam?.fromToken;
  assertEvm(fromToken);

  const chainId = fromToken.chainId as number;
  const from = quote?.quoteParam?.refundTo;
  const sendParam = quote?.sendParam;

  // Native service already produces a serializable { target, calldata, value, gasLimit }.
  if (sendParam?.txRequest) {
    const txRequest = sendParam.txRequest;
    return {
      chainId,
      from,
      to: txRequest.target,
      data: txRequest.calldata,
      value: toDecimalString(txRequest.value),
      gasLimit: txRequest.gasLimit === undefined || txRequest.gasLimit === null
        ? undefined
        : toDecimalString(txRequest.gasLimit),
    };
  }

  const { isOneClickService } = getQuoteModes({
    quoteData: quote,
    bridgeStore: { quoteDataService: serviceType },
  });

  if (isOneClickService) {
    // Proxy path -> contract call; simple path -> plain transfer to depositAddress.
    if (sendParam) {
      return { chainId, from, ...encodeContractCall(sendParam) };
    }
    return buildTransferTx({
      chainId,
      from,
      fromToken,
      depositAddress: quote?.quote?.depositAddress,
      amountWei: getSendAmountWei(serviceType, quote),
    });
  }

  if (!sendParam) {
    throw new Error("Quote has no sendParam to build transaction");
  }

  return { chainId, from, ...encodeContractCall(sendParam) };
};

/**
 * Build the ERC20 approve transaction(s) for a quote that requires approval.
 * On Ethereum an additional `approveResetTx` (approve 0) is returned so the
 * integrator can reset a stale allowance before setting a new one.
 */
export const buildApproveTx = (
  serviceType: Service,
  quote: any
): { approveTx?: EvmTxData; approveResetTx?: EvmTxData } => {
  if (!quote?.needApprove) {
    return {};
  }

  const fromToken: TokenConfig = quote?.quoteParam?.fromToken;
  assertEvm(fromToken);

  if (fromToken.contractAddress === "eth") {
    // Native token needs no approval.
    return {};
  }

  const chainId = fromToken.chainId as number;
  const from = quote?.quoteParam?.refundTo;
  const spender = quote?.approveSpender;
  if (!spender) {
    throw new Error("Quote requires approval but has no approveSpender");
  }

  const amountWei = getSendAmountWei(serviceType, quote);
  const iface = new ethers.Interface(erc20Abi as any);

  const approveTx: EvmTxData = {
    chainId,
    from,
    to: fromToken.contractAddress,
    data: iface.encodeFunctionData("approve", [spender, amountWei]),
    value: "0",
  };

  const result: { approveTx?: EvmTxData; approveResetTx?: EvmTxData } = { approveTx };

  if (fromToken.chainName === "Ethereum") {
    result.approveResetTx = {
      chainId,
      from,
      to: fromToken.contractAddress,
      data: iface.encodeFunctionData("approve", [spender, "0"]),
      value: "0",
    };
  }

  return result;
};

/**
 * Build the EIP-712 `Permit` typed data for a permit-required route, returned
 * unsigned. The integrator signs it with their MPC/Fireblocks signer, splits
 * the signature into `v/r/s`, and passes the assembled `permitSignature` to
 * `BridgeSFA.report`.
 */
export const buildPermitTypedData = async (params: {
  permitToken: TokenConfig;
  permitAmountWei: string;
  permitSpender: string;
  owner: string;
}): Promise<PermitTypedData> => {
  const { permitToken, permitAmountWei, permitSpender, owner } = params;
  assertEvm(permitToken);

  if (!owner) {
    throw new Error("buildPermitTypedData requires the permit owner address");
  }

  const provider = evmRpcFallbackProvider(permitToken);
  const erc20 = new ethers.Contract(permitToken.contractAddress, erc20Abi as any, provider);

  const [nonce, name] = await Promise.all([
    erc20.nonces(owner),
    erc20.name(),
  ]);

  // Mirror @stableflow/wallet-evm signTypedData: USDC uses version "2".
  const version = permitToken.symbol === "USDC" ? "2" : "1";
  const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3;

  const domain = {
    name,
    version,
    chainId: Number(permitToken.chainId),
    verifyingContract: permitToken.contractAddress,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const values = {
    owner,
    spender: permitSpender,
    value: toDecimalString(permitAmountWei),
    nonce: nonce.toString(),
    deadline,
  };

  return {
    domain,
    types,
    values,
    deadline,
    nonce: Number(nonce),
    token: permitToken.contractAddress,
    spender: permitSpender,
    owner,
  };
};
