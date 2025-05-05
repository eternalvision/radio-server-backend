import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRACK_DIR = process.env.TRACK_DIR;
const START_SCRIPT = path.join(__dirname, '..', process.env.START_SCRIPT);
const STOP_SCRIPT = path.join(__dirname, '..', process.env.STOP_SCRIPT);

export default {
  TRACK_DIR,
  START_SCRIPT,
  STOP_SCRIPT,
};
