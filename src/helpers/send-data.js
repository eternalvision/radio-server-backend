import { HttpCode, Messages } from './http.js';
import { Success, Conflict, NotFound, BadRequest, ServerError } from './responders.js';

const { OK, NOT_FOUND, CONFLICT, BAD_REQUEST, INTERNAL_SERVER_ERROR } = HttpCode;

const { AGAIN, BAD_DATA_REQUEST, NOT_FOUND_MESSAGE } = Messages;

export const resmap = {
  200: {
    Success: ({ res, data }) => Success(res, OK, data),
  },
  400: {
    BadRequest: ({ res, error }) => BadRequest(res, BAD_REQUEST, BAD_DATA_REQUEST, error),
  },
  404: {
    NotFound: ({ res }) => NotFound(res, NOT_FOUND, NOT_FOUND_MESSAGE),
  },
  409: {
    Conflict: ({ res }) => Conflict(res, CONFLICT, AGAIN),
  },
  500: {
    Error: ({ res, error }) => ServerError(res, INTERNAL_SERVER_ERROR, error),
  },
};

export const SendDataResponse = (options) => {
  try {
    const { code, processResponse } = options;
    const resfunc = resmap[code]?.[processResponse];
    if (resfunc) return resfunc(options);
  } catch (error) {
    console.error('[SendDataResponse] error:', error);
  }
};
