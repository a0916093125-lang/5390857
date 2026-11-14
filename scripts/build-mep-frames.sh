#!/usr/bin/env bash
# ==============================================================================
# 皓盛有限公司 (5390857.com) - 五站式 3D 微縮機電島嶼 AI 影片轉 WebP 序列幀自動管線 v31.0
# 用途：將 4 段 AI 首尾幀連貫運鏡影片 (clip1.mp4 ~ clip4.mp4，串連 5 座微縮機電島嶼) 無縫合併，
#       並壓縮輸出為桌機版 (1920px, 200幀) 與手機輕量版 (1080px, 200幀) WebP 序列幀。
#       輸出完成後，assets/mep-scroll-world.js 會自動偵測並無縫接管渲染！
# ==============================================================================
set -euo pipefail

RAW_DIR="./raw_clips"
DESKTOP_OUT="../assets/frames_desktop"
MOBILE_OUT="../assets/frames_mobile"
TOTAL_FRAMES=200

mkdir -p "$RAW_DIR" "$DESKTOP_OUT" "$MOBILE_OUT"

cat > "$RAW_DIR/concat_list.txt" <<EOF
file 'clip1.mp4'
file 'clip2.mp4'
file 'clip3.mp4'
file 'clip4.mp4'
EOF

if [[ ! -f "$RAW_DIR/clip1.mp4" ]]; then
  echo "提示：尚未偵測到 raw_clips/clip1.mp4，前端將自動使用內建 60fps 原生等距 3D 微縮島嶼引擎渲染。"
  echo "=== 五站式 3D 微縮島嶼首尾幀連貫生成規範 (Keyframe Chaining) ==="
  echo "Global Style Anchor: Isometric 3D architectural cutaway diorama, dark obsidian background #040812, cyan #38bdf8 and emerald #34d399 rim lighting, clean industrial MEP engineering miniature, 8k Octane Render, text-free, no watermarks"
  echo "Node 01 (頂樓冷卻水塔島): Floating isometric rooftop island with twin FRP cooling towers, rotating sprinkler water mist, chilled water risers"
  echo "Node 02 (商空與四台團購冷氣島): Floating isometric commercial office plenum with 4-way cassette AC unit and 4 residential wall-mounted split AC modules"
  echo "Node 03 (機房馬達泵閥動力島): Floating isometric mechanical room cutaway with centrifugal water pump, heavy pillow block bearing, and 8-inch gear butterfly valve"
  echo "Node 04 (地下淨水蓄水池島): Floating isometric underground twin RC water reservoir cutaway, crystal clear water and stainless steel 3-pole level probes"
  echo "Node 05 (急修排水器與氯錠商城島): Floating isometric dispatch station featuring condensate drain pump unit and pallet of sealed 25kg TCCA drums"
  exit 0
fi

ffmpeg -y -f concat -safe 0 -i "$RAW_DIR/concat_list.txt" -c copy "$RAW_DIR/merged_mep_world.mp4"

ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4" \
  -vf "fps=30,scale=1920:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES" \
  -c:v libwebp -lossless 0 -compression_level 6 -q:v 80 \
  "$DESKTOP_OUT/frame_%04d.webp"

ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4" \
  -vf "fps=24,scale=1080:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES" \
  -c:v libwebp -lossless 0 -compression_level 6 -q:v 75 \
  "$MOBILE_OUT/frame_%04d.webp"

echo "完成！共輸出 ${TOTAL_FRAMES} 幀雙端 WebP 序列幀。"
