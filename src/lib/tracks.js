import { join, relative, resolve, basename } from 'path';
import { readdirSync,  } from 'fs';
import { execFileSync } from 'child_process';
import config from '../config.js';

const { TRACK_DIR } = config;

const execJSON = (bin, args) => {
  const out = execFileSync(bin, args, { encoding: 'utf8' });
  return JSON.parse(out);
};

const hasAttachedCover = (filePath) => {
  try {
    const probe = execJSON('ffprobe', [
      '-v', 'error',
      '-print_format', 'json',
      '-show_streams',
      filePath
    ]);
    return (probe.streams || []).some(
      s => (s.disposition && s.disposition.attached_pic === 1) || s.codec_type === 'video'
    );
  } catch {
    return false;
  }
};


const extractCoverImageBase64 = (filePath) => {
  try {
    if (!hasAttachedCover(filePath)) return null;
    const buffer = execFileSync('ffmpeg', [
      '-v', 'error',
      '-i', filePath,
      '-an',
      '-vcodec', 'mjpeg',
      '-f', 'image2pipe',
      '-frames:v', '1',
      '-'
    ]);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('[extractCoverImageBase64] error:', err.message);
    return null;
  }
};

export const getTrackMetadata = (absolutePath) => {
  try {
    const parsed = execJSON('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'format=duration:format_tags=title,artist,album',
      '-of', 'json',
      absolutePath
    ]);

    const durationSec = parseFloat(parsed.format.duration);
    const minutes = Math.floor(durationSec / 60);
    const seconds = Math.round(durationSec % 60).toString().padStart(2, '0');

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
  const SKIP_DIRS = new Set(['.git', '.vscode', 'node_modules', '.cache', 'snap']);

  const walk = (currentDir) => {
    let entries = [];
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
      }
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
