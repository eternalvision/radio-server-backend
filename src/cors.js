const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'Accept',
  'Origin',
  'X-Requested-With',
  'X-Forwarded-For',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Origin',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'Access-Control-Expose-Headers',
  'X-Track-Title',
  'X-Track-Artist',
  'X-Track-Album',
  'X-Track-Duration',
  'X-Track-Cover',
];

export const corsOptions = {
  origin: '*',
  methods,
  allowedHeaders,
  optionsSuccessStatus: 200,
};
