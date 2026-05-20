import { postRequest } from '@stableflow/core';

export async function quoteSignature(params: any) {
  const response: any = await postRequest("/v0/cctp/sign", params);
  return response.data ?? {};
}
