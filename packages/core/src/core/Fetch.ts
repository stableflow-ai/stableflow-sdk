import { OpenAPI } from "./OpenAPI";
import { request } from "./request";

export const REQUEST_ERRORS: Record<number, string> = {
  400: `Bad Request - Invalid input data`,
  401: `Unauthorized - JWT token is invalid`,
};

export const getRequest = <T>(url: string, query?: Record<string, any>) => {
  return request<T>(OpenAPI, {
    method: 'GET',
    timeout: 30000,
    url: url,
    query: query,
    headers: {
      "Content-Type": "application/json",
    },
    errors: REQUEST_ERRORS,
  });
};

export const postRequest = <T>(url: string, data?: any) => {
  return request<T>(OpenAPI, {
    method: 'POST',
    timeout: 30000,
    url: url,
    body: data,
    mediaType: 'application/json',
    errors: REQUEST_ERRORS,
  });
};
