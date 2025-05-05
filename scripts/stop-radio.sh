#!/bin/bash

echo "[stop-radio] Stopping stream..."
pkill -f ffmpeg
echo "[stop-radio] Stream stopped."
