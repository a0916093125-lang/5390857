#!/usr/bin/env bash
# ==============================================================================
# 皓盛有限公司 (5390857.com) - 3D 沉浸式機電滾動官網 AI 影片轉 WebP 序列幀自動管線
# ==============================================================================
set -euo pipefail

RAW_DIR="./raw_clips"
DESKTOP_OUT="../assets/frames_desktop"
MOBILE_OUT="../assets/frames_mobile"
TOTAL_FRAMES=180

mkdir -p "$RAW_DIR" "$DESKTOP_OUT" "$MOBILE_OUT"

echo "[1/4] 檢查 AI 分鏡影片清單 (clip1.mp4, clip2.mp4, clip3.mp4)..."
cat > "$RAW_DIR/concat_list.txt" <<EOF
file 'clip1.mp4'
file 'clip2.mp4'
file 'clip3.mp4'
EOF

if [[ ! -f "$RAW_DIR/clip1.mp4" ]]; then
  echo "提示：請先依照明細規範生成 clip1.mp4 ~ clip3.mp4 並放入 scripts/raw_clips/ 資料夾。"
  exit 0
fi

echo "[2/4] 無縫串接三段分鏡過渡影片..."
ffmpeg -y -f concat -safe 0 -i "$RAW_DIR/concat_list.txt" -c copy "$RAW_DIR/merged_mep_world.mp4"

DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$RAW_DIR/merged_mep_world.mp4")
TARGET_FPS=$(awk -v frames="$TOTAL_FRAMES" -v dur="$DURATION" 'BEGIN { if (dur <= 0) dur = 6; printf "%.4f", frames / dur }')

rm -f "$DESKTOP_OUT"/frame_*.webp "$MOBILE_OUT"/frame_*.webp

echo "[3/4] 轉出桌機版高畫質 WebP 序列幀 (1920px, 品質 80, 共 ${TOTAL_FRAMES} 幀)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4"   -vf "fps=${TARGET_FPS},scale=1920:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES"   -c:v libwebp -lossless 0 -compression_level 6 -q:v 80   "$DESKTOP_OUT/frame_%04d.webp"

echo "[4/4] 轉出手機端輕量防崩潰 WebP 序列幀 (1080px, 品質 72)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4"   -vf "fps=${TARGET_FPS},scale=1080:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES"   -c:v libwebp -lossless 0 -compression_level 6 -q:v 72   "$MOBILE_OUT/frame_%04d.webp"

echo "完成！前端 mep-scroll-world.js 將自動載入 WebP 序列幀。"
