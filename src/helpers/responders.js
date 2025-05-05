import { Statuses } from './http.js';

export const Success = (res, code, data) => {
  return res.status(code).send({
    code,
    status: Statuses.SUCCESS,
    data,
  });
};

export const Conflict = (res, code, message) => {
  return res.status(code).send({
    code,
    status: Statuses.ERROR,
    message,
  });
};

export const NotFound = (res, code, message) => {
  return res.status(code).send({
    code,
    status: Statuses.ERROR,
    message,
  });
};

export const BadRequest = (res, code, message, error) => {
  return res.status(code).send({
    code,
    status: Statuses.ERROR,
    message,
    error,
  });
};

export const ServerError = (res, code, error) => {
  return res.status(code).send({
    code,
    status: Statuses.ERROR,
    error: error.message || error,
  });
};
