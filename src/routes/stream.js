import { createReadStream, existsSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import { getTrackMetadata, findTracksRecursively } from '../lib/tracks.js';
import config from '../config.js';

const { TRACK_DIR } = config;

const mimeTypes = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
};

export const streamRoute = async (request, reply) => {
  try {
    const tracks = findTracksRecursively(TRACK_DIR);
    if (tracks.length === 0) return reply.code(404).send();

    const relativeTrack = request.query?.file
      ? decodeURIComponent(request.query.file)
      : tracks[Math.floor(Math.random() * tracks.length)];

    const absolutePath = resolve(TRACK_DIR, relativeTrack);
    if (!existsSync(absolutePath)) return reply.code(404).send();

    const metadata = getTrackMetadata(absolutePath);
    const stat = statSync(absolutePath);
    const fileSize = stat.size;
    const ext = extname(absolutePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    reply
      .header('Access-Control-Allow-Origin', '*')
      .header(
        'Access-Control-Expose-Headers',
        'X-Track-Title, X-Track-Artist, X-Track-Album, X-Track-Duration, X-Track-Cover, X-Track-Path'
      )
      .header('X-Track-Title', encodeURIComponent(metadata.title || ''))
      .header('X-Track-Artist', encodeURIComponent(metadata.artist || ''))
      .header('X-Track-Album', encodeURIComponent(metadata.album || ''))
      .header('X-Track-Duration', metadata.duration || '')
      .header('X-Track-Cover', encodeURIComponent(metadata.cover || ''))
      .header('X-Track-Path', encodeURIComponent(relativeTrack));

    const range = request.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      reply
        .code(206)
        .header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', chunkSize)
        .header('Content-Type', contentType);

      return createReadStream(absolutePath, { start, end });
    }

    reply.code(200).header('Content-Length', fileSize).header('Content-Type', contentType);

    return createReadStream(absolutePath);
  } catch (err) {
    console.error('[streamRoute] Error:', err.message);
    reply.code(500).send();
  }
};
