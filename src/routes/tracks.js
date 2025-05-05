import config from '../config.js';
import { HttpCode, SendDataResponse } from '../helpers/index.js';
import { findTracksAsStructuredTree } from '../lib/tracks.js';

const { TRACK_DIR } = config;
const { OK, NOT_FOUND } = HttpCode;

export const tracksRoute = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 1000;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = findTracksAsStructuredTree(TRACK_DIR, TRACK_DIR, limit, offset);

    if (Object.keys(result.structure).length === 0) {
      return SendDataResponse({
        res,
        code: NOT_FOUND,
        processResponse: 'NotFound',
      });
    }

    return SendDataResponse({
      res,
      code: OK,
      processResponse: 'Success',
      data: {
        tracks: result.structure,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      },
    });
  } catch (err) {
    return SendDataResponse({
      res,
      code: HttpCode.INTERNAL_SERVER_ERROR,
      processResponse: 'Error',
      error: err,
    });
  }
};
