#!/usr/bin/env bash
# ==============================================================================
# 皓盛有限公司 (5390857.com) - 3D 沉浸式機電滾動官網 AI 影片轉 WebP 序列幀自動管線
# 用途：將 3 段 AI 首尾幀連貫運鏡影片 (clip1.mp4 ~ clip3.mp4) 無縫合併，
#       並壓縮輸出為桌機版 (1920px, 180幀) 與手機輕量版 (1080px, 180幀) WebP 序列幀。
#       輸出完成後，assets/mep-scroll-world.js 會自動偵測並切換為真實序列幀渲染！
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
  echo "=== 以下為各階段 AI 首尾幀連貫生成 Prompt (Keyframe Chaining) ==="
  echo "Global Style Anchor: 24mm wide-angle lens, f/2.8, industrial MEP engineering photography, dark cyan and amber volumetric lighting, photorealistic 8k, Octane Render"
  echo "Frame 01 (RF 頂樓冷卻水塔): Top-down symmetrical view looking directly into a massive commercial FRP cooling tower fan intake on a Taipei skyscraper rooftop, stainless steel sprinkler head and blue chilled water pipes framing a deep central vertical shaft..."
  echo "Frame 02 (3F-12F 商空冰水盤管): Inside a high-tech commercial ceiling plenum, symmetrical 4-way cassette fan coil unit and copper chilled water coil array forming a glowing central tunnel..."
  echo "Frame 03 (MECH 機房泵閥核心): Symmetrical interior of an industrial mechanical room, heavy-duty cast iron centrifugal water pump, pillow block bearing and 8-inch gear-operated butterfly valve flange opening in dead center..."
  echo "Frame 04 (B2 地下室 RC 蓄水池): Inside a pristine, spotless underground reinforced concrete water reservoir after high-pressure hydro-jetting, Omron 61F-G2 stainless steel electrode probe on wall, crystal clear water reflection..."
  exit 0
fi

echo "[2/4] 無縫串接三段分鏡過渡影片..."
ffmpeg -y -f concat -safe 0 -i "$RAW_DIR/concat_list.txt" -c copy "$RAW_DIR/merged_mep_world.mp4"

echo "[3/4] 轉出桌機版高畫質 WebP 序列幀 (1920px, 品質 80, 共 180 幀)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4" \
  -vf "fps=30,scale=1920:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES" \
  -c:v libwebp -lossless 0 -compression_level 6 -q:v 80 \
  "$DESKTOP_OUT/frame_%04d.webp"

echo "[4/4] 轉出手機端輕量防崩潰 WebP 序列幀 (1080px, 品質 75, 共 180 幀)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4" \
  -vf "fps=30,scale=1080:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES" \
  -c:v libwebp -lossless 0 -compression_level 6 -q:v 75 \
  "$MOBILE_OUT/frame_%04d.webp"

echo "完成！前端 mep-scroll-world.js 將自動載入 WebP 序列幀。"
