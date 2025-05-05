import { join, relative, resolve, basename } from 'path';
import { readdirSync } from 'fs';
import { execSync } from 'child_process';
import config from '../config.js';

const { TRACK_DIR } = config;

const extractCoverImageBase64 = (filePath) => {
  try {
    const cmd = `ffmpeg -v error -i "${filePath}" -an -vcodec mjpeg -f image2pipe -frames:v 1 -`;
    const buffer = execSync(cmd);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('[extractCoverImageBase64] error:', err.message);
    return null;
  }
};

export const getTrackMetadata = (absolutePath) => {
  try {
    const cmd = `ffprobe -v error -select_streams a:0 -show_entries format=duration:format_tags=title,artist,album -of json "${absolutePath}"`;
    const result = execSync(cmd).toString();
    const parsed = JSON.parse(result);

    const durationSec = parseFloat(parsed.format.duration);
    const minutes = Math.floor(durationSec / 60);
    const seconds = Math.round(durationSec % 60)
      .toString()
      .padStart(2, '0');

    const cover = extractCoverImageBase64(absolutePath);

    return {
      title: parsed.format.tags?.title || basename(absolutePath),
      artist: parsed.format.tags?.artist || null,
      album: parsed.format.tags?.album || null,
      duration: `${minutes}:${seconds}`,
      cover,
    };
  } catch (err) {
    console.error('[getTrackMetadata] error:', err.message);
    return null;
  }
};

export const buildStructure = (base, parts, trackName, root) => {
  let current = base;
  for (const part of parts) {
    if (!current[part]) current[part] = {};
    current = current[part];
  }

  if (!current.tracks) current.tracks = [];
  const abs = resolve(root, ...parts, trackName);
  const metadata = getTrackMetadata(abs);

  current.tracks.push({
    name: trackName,
    ...metadata,
  });
};

export const findTracksAsStructuredTree = (dir, baseDir = TRACK_DIR, limit = 1000, offset = 0) => {
  const structure = {};
  const allTracks = [];

  const walk = (currentDir) => {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.(mp3|wav|flac)$/i.test(entry.name)) {
        const relativePath = relative(baseDir, fullPath);
        allTracks.push(relativePath);
      }
    }
  };

  walk(dir);

  const slicedTracks = allTracks.slice(offset, offset + limit);
  for (const relativePath of slicedTracks) {
    const parts = relativePath.split('/');
    const trackName = parts.pop();
    buildStructure(structure, parts, trackName, baseDir);
  }

  return {
    structure,
    total: allTracks.length,
    limit,
    offset,
  };
};

export const findTracksRecursively = (dir) => {
  let results = [];
  const list = readdirSync(dir, { withFileTypes: true });

  for (const file of list) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(findTracksRecursively(fullPath));
    } else if (file.isFile() && /\.(mp3|wav|flac)$/i.test(file.name)) {
      const relativePath = relative(TRACK_DIR, fullPath);
      results.push(relativePath);
    }
  }

  return results;
};
