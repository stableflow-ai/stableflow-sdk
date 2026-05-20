import {
  usdcChains,
  Service,
  tokens,
  postRequest,
  getRequest,
} from '@stableflow/core';
import { formatQuoteError, ServiceMap } from '@stableflow/bridges';
import type { WalletConfig, TokenConfig } from '@stableflow/core';

const SPENDER = "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7";
const DESTINATION_TOKEN = usdcChains["arb"];
const MIN_AMOUNT = 5 * (10 ** DESTINATION_TOKEN.decimals);

class HyperliquidService {
  public async quote(params: HyperliquidQuoteParams): Promise<{ quote: any; error: string | null; }> {

    const result: { quote: any; error: string | null; } = { quote: null, error: null };

    if (BigInt(params.amountWei || 0) < BigInt(MIN_AMOUNT)) {
      result.error = `Amount is too low, at least ${MIN_AMOUNT}`;
      return result;
    }

    const quoteParams = {
      ...params,
      dry: params.dry ?? true,
      slippageTolerance: params.slippageTolerance * 100,
      originAsset: params.fromToken.assetId,
      toToken: DESTINATION_TOKEN,
      destinationAsset: DESTINATION_TOKEN.assetId,
      amount: params.amountWei,
      refundType: "ORIGIN_CHAIN",
      appFees: params.oneclickParams?.appFees,
      swapType: "EXACT_OUTPUT",
      isProxy: false,
    };

    try {
      const quoteRes = await ServiceMap[Service.OneClick].quote(quoteParams);
      result.quote = quoteRes;
    } catch (error) {
      const _err = formatQuoteError(error, { service: Service.OneClick, fromToken: params.fromToken });
      result.error = _err.error;
    }

    return result;
  }

  public async transfer(params: HyperliquidTransferParams): Promise<string> {
    const {
      quote,
      wallet,
    } = params;

    const sendParams = {
      wallet,
      sendParam: quote?.sendParam,
      fromToken: quote?.quoteParam.fromToken,
      depositAddress: quote?.quote?.depositAddress,
      amountWei: quote?.quote?.amountIn,
    };

    const txhash = await ServiceMap[Service.OneClick].send(sendParams);

    return txhash;
  }

  public async deposit(params: HyperliquidDepositParams): Promise<HyperliquidDepositResponse> {
    const {
      evmWallet,
      evmWalletAddress,
      quote,
      txhash,
    } = params;

    const permitParams = await this.generatePermit({
      evmWalletAddress,
      evmWallet,
      amountWei: quote?.quote?.amountOut,
    });

    const depositParams = {
      deposit_address: quote?.quote?.depositAddress,
      from_addr: quote?.quoteParam?.refundTo,
      from_amount: quote?.quote?.amountIn,
      from_chain: quote?.quoteParam?.fromToken?.blockchain,
      from_hash: txhash,
      from_token: quote?.quoteParam?.fromToken?.contractAddress,
      sender: quote?.quoteParam?.recipient,
      to_amount: quote?.quote?.amountOut,
      to_chain: quote?.quoteParam?.toToken?.blockchain,
      to_token: quote?.quoteParam?.toToken?.contractAddress,
      type: Service.OneClick,

      permit: permitParams,
    };

    const depositRes = await postRequest("/v0/deposit", depositParams);

    return depositRes as HyperliquidDepositResponse;
  }

  public getStatus(params: HyperliquidGetStatusParams): Promise<HyperliquidDepositStatusResponse> {
    return getRequest("/v0/deposit/status", {
      depositId: params.depositId,
    });
  }

  protected async generatePermit(params: HyperliquidGeneratePermitParams) {
    const {
      evmWalletAddress,
      evmWallet,
      amountWei,
    } = params;

    const tokenAddress = DESTINATION_TOKEN.contractAddress;

    const signature = await (evmWallet as any).signTypedData({
      fromToken: DESTINATION_TOKEN,
      amountWei: amountWei,
      spender: SPENDER,
    });

    const permitParams = {
      amount: signature.value,
      deadline: signature.deadline,
      owner: signature.owner,
      r: signature.r,
      s: signature.s,
      spender: SPENDER,
      token: tokenAddress,
      v: signature.v,
      nonce: signature.nonce,
    };

    return permitParams;
  }
}

export const Hyperliquid = new HyperliquidService();

export const HyperliquidFromTokens = tokens
  .filter((token) => token.services.includes(Service.OneClick))
  .filter((token) => !(token.chainName === "Arbitrum" && token.symbol === "USDC"));
export const HyperliuquidToToken = DESTINATION_TOKEN;
export const HyperliuquidMinAmount = MIN_AMOUNT + "";

export interface HyperliquidQuoteParams {
  slippageTolerance: number;
  refundTo: string;
  recipient: string;
  wallet: WalletConfig;
  fromToken: TokenConfig;
  prices: Record<string, string>;
  amountWei: string;
  // Whether to generate deposit address
  // false will generate a deposit address
  dry?: boolean;
  oneclickParams?: {
    appFees?: { recipient: string; fee: number; }[];
  };
}

export interface HyperliquidTransferParams {
  // bridge wallet
  wallet: WalletConfig;
  // deposit wallet (evm wallet)
  evmWallet: WalletConfig;
  // deposit wallet address
  evmWalletAddress: string;
  // quote result with deposit address
  quote: any;
}

export interface HyperliquidGeneratePermitParams {
  evmWalletAddress: string;
  evmWallet: WalletConfig;
  amountWei: string;
}

export interface HyperliquidDepositParams extends HyperliquidTransferParams {
  txhash: string;
}

export interface HyperliquidGetStatusParams {
  depositId: string;
}

export interface HyperliquidResponse<T> {
  code: number;
  data: T;
}

export interface HyperliquidDepositResponseData {
  depositId: number;
}

export type HyperliquidDepositResponse = HyperliquidResponse<HyperliquidDepositResponseData>;

export type HyperliquidDepositStatus = "PROCESSING" | "SUCCESS" | "REFUNDED" | "FAILED";

export interface HyperliquidDepositStatusResponseData {
  status: HyperliquidDepositStatus;
  txHash: string;
}

export type HyperliquidDepositStatusResponse = HyperliquidResponse<HyperliquidDepositStatusResponseData>;
