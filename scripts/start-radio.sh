#!/bin/bash

# === CONFIG ===
TRACK_DIR="/home/sasha/Music"
TRACK="$1"
TRACK_PATH="$TRACK_DIR/$TRACK"
AUDIO_SINK="RadioSink"
FFMPEG_LOG="/tmp/radio-ffmpeg.log"

# === CHECK: подключён ли диск ===
if [ ! -d "$TRACK_DIR" ]; then
  echo "[start-radio] ❌ Директория $TRACK_DIR не найдена."
  exit 1
fi

# === CHECK: установлены ли необходимые пакеты ===
REQUIRED_CMDS=("ffmpeg" "pactl" "pulseaudio")
for cmd in "${REQUIRED_CMDS[@]}"; do
  if ! command -v $cmd &>/dev/null; then
    echo "[start-radio] 🔧 Устанавливается $cmd..."
    sudo apt update && sudo apt install -y $cmd
  fi
done

# === CHECK: запущен ли PulseAudio ===
if ! pgrep -x "pulseaudio" > /dev/null; then
  echo "[start-radio] 🚀 Запуск PulseAudio..."
  pulseaudio --start
  sleep 1
fi

# === CHECK: создан ли виртуальный sink ===
if ! pactl list short sinks | grep -q RadioSink; then
  echo "[start-radio] 🎛 Создание виртуального аудиосинка RadioSink..."
  pactl load-module module-null-sink sink_name=RadioSink sink_properties=device.description=RadioSink
  sleep 1
fi

# === CHECK: существует ли трек ===
if [ ! -f "$TRACK_PATH" ]; then
  echo "[start-radio] ❌ Трек не найден: $TRACK_PATH"
  exit 1
fi

# === KILL: старый ffmpeg ===
echo "[start-radio] 🧹 Остановка старого ffmpeg..."
pkill -f ffmpeg

# === START ===
echo "[start-radio] ▶️ Запуск трека: $TRACK_PATH"
ffmpeg \
  -re -i "$TRACK_PATH" \
  -c:a pcm_s16le -f pulse "$AUDIO_SINK" \
  > "$FFMPEG_LOG" 2>&1 &

echo "[start-radio] ✅ Воспроизведение запущено"
