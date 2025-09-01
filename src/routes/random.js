import { exec } from 'child_process';
import { resolve } from 'path';
import config from '../config.js';
import { HttpCode, SendDataResponse } from '../helpers/index.js';
import { getTrackMetadata, findTracksRecursively } from '../lib/tracks.js';

const { TRACK_DIR, START_SCRIPT } = config;
const { NOT_FOUND, INTERNAL_SERVER_ERROR, OK } = HttpCode;

export const randomRoute = async (req, res) => {
  try {
    const tracks = findTracksRecursively(TRACK_DIR);

    if (tracks.length === 0) {
      return SendDataResponse({ res, code: NOT_FOUND, processResponse: 'NotFound' });
    }

    const relativeTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const absolutePath = resolve(TRACK_DIR, relativeTrack);
    const data = getTrackMetadata(absolutePath);

    SendDataResponse({ res, code: OK, processResponse: 'Success', data });

    execFile(START_SCRIPT, [relativeTrack], { shell: false }, (err) => {
      if (err) console.error('[start script]', err.message);
    });
  } catch (err) {
    return SendDataResponse({
      res,
      code: INTERNAL_SERVER_ERROR,
      processResponse: 'Error',
      error: err,
    });
  }
};
