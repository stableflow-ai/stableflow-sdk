import type { GetStatusParams, SubmitDepositTxResponse } from '@stableflow/core';
import {
  OpenAPI,
  Service,
  ServiceBackend,
  TransactionStatus,
  tokens,
  type TokenConfig,
  type WalletConfig,
  getRouteStatus,
  Csl,
  CancelablePromise,
  StableflowStatus,
  LayerZeroStatus,
  OneClickStatus,
  postRequest,
} from '@stableflow/core';
import Big from 'big.js';
import { ServiceMap } from './service-map';
import { formatQuoteError, getQuoteModes } from './utils';

export interface GetAllQuoteParams {
  singleService?: Service;
  disabledServices?: Service[];
  dry?: boolean;
  prices: Record<string, string>;
  fromToken: TokenConfig;
  toToken: TokenConfig;
  wallet: WalletConfig;
  evmWallet?: WalletConfig | null;
  evmAddress?: string | null;
  recipient: string;
  refundTo: string;
  amountWei: string;
  slippageTolerance: number;
  minInputAmount?: string;
  /** @deprecated Please migrate to oneclickParams */
  appFees?: { recipient: string; fee: number; }[];
  oneclickParams?: {
    appFees?: { recipient: string; fee: number; }[];
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT" | "FLEX_INPUT";
    isProxy?: boolean;
  };
}

const submitOthersTx = (
  requestBody: {
    address: string;
    amount?: string;
    deposit_address: string;
    destination_domain_id?: number;
    fee?: string;
    project: "nearintents" | "layerzero" | "cctp";
    receive_address: string;
    source_domain_id?: number;
    out_amount?: string;
    from_chain?: string;
    symbol?: string;
    to_chain?: string;
    to_symbol?: string;
    tx_hash?: string;
    layer_zero_permit?: unknown;
    frax_zero_permit?: unknown;
  },
): CancelablePromise<SubmitDepositTxResponse> => {
  return postRequest('/v0/trade/add', requestBody);
};

/**
 * Full cross-chain bridge API (multi-route quote, send, status).
 * Install `@stableflow/bridges` alongside `@stableflow/core`.
 */
export class BridgeSFA {
  public static async getAllQuote(params: GetAllQuoteParams): Promise<Array<{ serviceType: Service; quote?: any; error?: string }>> {
    const results: Array<{ serviceType: Service; quote?: any; error?: string }> = [];

    let { minInputAmount = "1", disabledServices } = params;
    if (Big(minInputAmount).lte(0)) {
      minInputAmount = "1";
    }

    if (
      !params.fromToken
      || !params.fromToken.contractAddress
      || !params.toToken
      || !params.toToken.contractAddress
      || !params.refundTo
      || !params.recipient
      || !params.amountWei
      || Big(params.amountWei).lte(minInputAmount)
    ) {
      throw new Error('Invalid parameters');
    }

    const formatQuoteParams = (service: Service) => {
      const _params: any = {
        dry: params.dry,
        amountWei: params.amountWei,
        refundTo: params.refundTo || "",
        recipient: params.recipient,
        wallet: params.wallet,
        fromToken: params.fromToken,
        toToken: params.toToken,
        prices: params.prices,
        slippageTolerance: params.slippageTolerance,
        evmWallet: params.evmWallet,
        evmAddress: params.evmAddress,
      };

      if (([
        Service.OneClick,
        Service.Usdt0OneClick,
        Service.OneClickUsdt0,
        Service.FraxZeroOneClick,
        Service.OneClickFraxZero,
      ] as Service[]).includes(service)) {
        _params.slippageTolerance = params.slippageTolerance * 100;
        _params.originAsset = params.fromToken.assetId;
        _params.destinationAsset = params.toToken.assetId;
        _params.refundType = "ORIGIN_CHAIN";
        _params.appFees = params.oneclickParams?.appFees || params.appFees;
        _params.swapType = params.oneclickParams?.swapType;
        _params.isProxy = params.oneclickParams?.isProxy;
      }
      if (([
        Service.Usdt0,
        Service.CCTP,
        Service.Usdt0OneClick,
        Service.OneClickUsdt0
      ] as Service[]).includes(service)) {
        _params.originChain = params.fromToken.chainName;
        _params.destinationChain = params.toToken.chainName;
      }
      return _params;
    };

    const fromToken = tokens.find(token => token.contractAddress.toLowerCase() === params.fromToken.contractAddress.toLowerCase());
    const toToken = tokens.find(token => token.contractAddress.toLowerCase() === params.toToken.contractAddress.toLowerCase());

    if (!fromToken || !toToken) {
      throw new Error('Token pair not supported');
    }

    const isFromUsdt = ["USDT", "USD₮0"].includes(fromToken.symbol);
    const isToUsdt = ["USDT", "USD₮0"].includes(toToken.symbol);

    const quoteServices: any = [];
    const pushQuoteService = (_service: Service) => {
      const serviceStatus = getRouteStatus(_service, disabledServices);
      if (serviceStatus.disabled) {
        return;
      }
      const quoteParams = formatQuoteParams(_service);
      quoteServices.push({
        service: _service,
        quote: () => {
          return ServiceMap[_service].quote(quoteParams);
        },
      });
    };

    for (const serviceType of Object.values(Service)) {
      if (
        fromToken.services.includes(serviceType)
        && toToken.services.includes(serviceType)
      ) {
        pushQuoteService(serviceType);
      }
    }

    if (
      fromToken.services.includes(Service.Usdt0)
      && toToken.services.includes(Service.OneClick)
      && fromToken.chainName !== "Arbitrum"
    ) {
      if (isFromUsdt && isToUsdt) {
        if (toToken.chainName !== "Arbitrum") {
          pushQuoteService(Service.Usdt0OneClick);
        }
      } else {
        pushQuoteService(Service.Usdt0OneClick);
      }
    }

    if (
      fromToken.services.includes(Service.OneClick)
      && toToken.services.includes(Service.Usdt0)
      && toToken.chainName !== "Arbitrum"
    ) {
      if (isFromUsdt && isToUsdt) {
        if (fromToken.chainName !== "Arbitrum") {
          pushQuoteService(Service.OneClickUsdt0);
        }
      } else {
        pushQuoteService(Service.OneClickUsdt0);
      }
    }

    if (
      fromToken.services.includes(Service.FraxZero)
      && toToken.services.includes(Service.OneClick)
    ) {
      pushQuoteService(Service.FraxZeroOneClick);
    }

    if (
      fromToken.services.includes(Service.OneClick)
      && toToken.services.includes(Service.FraxZero)
    ) {
      pushQuoteService(Service.OneClickFraxZero);
    }

    if (params.singleService) {
      const quoteService = quoteServices.find((service: any) => service.service === params.singleService);
      if (quoteService) {
        try {
          const quoteRes = await quoteService.quote();
          results.push({
            serviceType: quoteService.service,
            quote: quoteRes,
          });
        } catch (error) {
          const _err = formatQuoteError(error, { service: quoteService.service, fromToken });
          results.push(_err);
        }
      }
      return results;
    }

    const promises: Promise<void>[] = [];
    for (const quoteService of quoteServices) {
      const promise = (async () => {
        try {
          const quoteRes = await quoteService.quote();
          results.push({
            serviceType: quoteService.service,
            quote: quoteRes,
          });
        } catch (error) {
          console.log("%s quote failed: %o", quoteService.service, error);
          const _err = formatQuoteError(error, { service: quoteService.service, fromToken });
          results.push(_err);
        }
      })();
      promises.push(promise);
    }
    await Promise.allSettled(promises);
    return results;
  }

  public static async send(
    serviceType: Service,
    params: {
      wallet: any;
      quote: any;
      permitSignature?: {
        amount: string;
        deadline: number;
        nonce: string;
        owner: string;
        r: string;
        s: string;
        v: 27 | 28;
      };
    }
  ): Promise<string> {
    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;

    const service = ServiceMap[serviceType];
    if (!service) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }

    if (!service.send) {
      throw new Error(`Service ${serviceType} does not support send method`);
    }

    const { quote, wallet, permitSignature } = params;

    if (!quote) {
      throw new Error('Quote data is required');
    }

    if (quote.needPermit) {
      if (!permitSignature) {
        throw new Error('Permit signature is required');
      }
    }

    const sendParams: any = {
      wallet,
    };

    const { isExactOutput, isOneClickService, isQuoteParamDepositAddress } = getQuoteModes({
      quoteData: quote,
      bridgeStore: { quoteDataService: serviceType },
    });
    const fromToken = quote.quoteParam.fromToken;
    const toToken = quote.quoteParam.toToken;
    const depositAddress = quote.quote?.depositAddress;
    const sendParam = quote.sendParam;

    let _amountWei = quote.quoteParam?.amountWei;
    if (isExactOutput) {
      _amountWei = quote.quote?.minAmountIn;
    }

    if (isOneClickService) {
      sendParams.sendParam = sendParam;
      sendParams.fromToken = fromToken;
      sendParams.depositAddress = depositAddress;
      sendParams.amountWei = _amountWei;
    } else {
      for (const key in sendParam) {
        sendParams[key] = sendParam[key];
      }
    }

    csl("BridgeSFA.send", "blue-400", "sendParams: %o", sendParams);

    const txhash = await service.send(sendParams);

    try {
      const reportData: any = {
        project: ServiceBackend[serviceType] as any,
        address: quote.quoteParam?.refundTo,
        amount: isExactOutput ? quote.quote.amountInFormatted : Big(_amountWei || 0).div(10 ** (fromToken?.decimals || 6)).toFixed(fromToken?.decimals || 6, 0),
        out_amount: quote.outputAmount,
        deposit_address: isOneClickService ? quote.quote?.depositAddress : "",
        receive_address: quote.quoteParam?.recipient,
        from_chain: fromToken.blockchain,
        symbol: /^USD₮0$/i.test(fromToken.symbol) ? "USDT" : fromToken.symbol,
        to_chain: toToken.blockchain,
        to_symbol: /^USD₮0$/i.test(toToken.symbol) ? "USDT" : toToken.symbol,
        tx_hash: "",
      };

      if (permitSignature) {
        if (([Service.OneClickUsdt0] as Service[]).includes(serviceType)) {
          reportData.layer_zero_permit = {
            ...permitSignature,
            ...quote.permitAdditionalData,
          };
        }
        if (([Service.OneClickFraxZero, Service.FraxZeroOneClick] as Service[]).includes(serviceType)) {
          reportData.frax_zero_permit = {
            ...permitSignature,
            ...quote.permitAdditionalData,
          };
        }
      }

      reportData.tx_hash = txhash;

      let _depositAddress = txhash;
      if (isQuoteParamDepositAddress) {
        _depositAddress = quote.quoteParam?.depositAddress || txhash;
      }
      if (!reportData.deposit_address) {
        reportData.deposit_address = _depositAddress;
      }

      if (serviceType === Service.Native) {
        const quoteIds = quote?.orders?.map?.((order: any) => order.quoteId) || [];
        reportData.quoteIds = quoteIds;
      }

      csl("BridgeSFA.send", "blue-400", "reportData: %o", reportData);

      submitOthersTx(reportData);
    } catch (error) {
      console.log("%cReport tx failed: %o", "background:#f00;color:#fff;", error);
    }

    return txhash;
  }

  public static async getStatus(
    serviceType: Service,
    params: {
      quote: any;
      hash: string;
    }
  ): Promise<{ status: TransactionStatus; toChainTxHash?: string; }> {
    const cs = new Csl(OpenAPI.DEBUG);
    const csl = cs.log;

    const service = ServiceMap[serviceType];
    if (!service) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }

    if (!service.getStatus) {
      throw new Error(`Service ${serviceType} does not support getStatus method`);
    }

    const { quote, hash } = params;

    const getStatusParams: GetStatusParams = {};

    const { isOneClickService, isQuoteParamDepositAddress } = getQuoteModes({
      quoteData: quote,
      bridgeStore: { quoteDataService: serviceType },
    });

    getStatusParams.depositAddress = isOneClickService ? quote.quote.depositAddress : "";
    getStatusParams.hash = hash;

    if (!isOneClickService) {
      let _depositAddress = hash;
      if (isQuoteParamDepositAddress) {
        _depositAddress = quote?.quoteParam?.depositAddress || hash;
      }
      getStatusParams.depositAddress = _depositAddress;
    }

    csl("getStatus", "fuchsia-500", "getStatusParams: %o", getStatusParams);

    const result: { status: TransactionStatus; toChainTxHash?: string; } = { status: TransactionStatus.Pending };
    const response = await service.getStatus(getStatusParams);

    if (([Service.CCTP, Service.Native] as Service[]).includes(serviceType)) {
      const _result = response?.data;
      const status = _result?.status;
      if (status === StableflowStatus.SUCCESS) {
        result.status = TransactionStatus.Success;
        result.toChainTxHash = _result?.to_tx_hash;
      }
      if (status === StableflowStatus.FAILED) {
        result.status = TransactionStatus.Failed;
      }
    }

    if (([Service.Usdt0] as Service[]).includes(serviceType)) {
      const _result = response?.data?.[0];
      const status = _result?.status?.name;
      if (status === LayerZeroStatus.DELIVERED) {
        result.status = TransactionStatus.Success;
        result.toChainTxHash = _result?.destination?.tx?.txHash;
      }
      if ([LayerZeroStatus.FAILED, LayerZeroStatus.BLOCKED].includes(status)) {
        result.status = TransactionStatus.Failed;
      }
    }

    if (([Service.OneClick] as Service[]).includes(serviceType)) {
      const status = response?.status;

      if (status === OneClickStatus.SUCCESS) {
        result.status = TransactionStatus.Success;
        result.toChainTxHash = response?.swapDetails?.destinationChainTxHashes?.[0]?.hash;
      }

      if ([OneClickStatus.REFUNDED, OneClickStatus.FAILED].includes(status)) {
        result.status = TransactionStatus.Failed;
      }
    }

    if (([Service.OneClickUsdt0, Service.Usdt0OneClick, Service.FraxZero, Service.OneClickFraxZero, Service.FraxZeroOneClick] as Service[]).includes(serviceType)) {
      const _result = response?.data;
      const status = _result?.status;
      if (status === StableflowStatus.SUCCESS) {
        result.status = TransactionStatus.Success;
        result.toChainTxHash = _result?.to_tx_hash;
      }
      if (status === StableflowStatus.FAILED) {
        result.status = TransactionStatus.Failed;
      }
    }

    return result;
  }
}
