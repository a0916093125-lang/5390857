#!/usr/bin/env bash
# ==============================================================================
# 皓盛有限公司 (5390857.com) - 3D 沉浸式機電滾動官網 AI 影片轉 WebP 序列幀自動管線
# 用途：將 3 段 AI 首尾幀連貫運鏡影片 (clip1.mp4 ~ clip3.mp4) 無縫合併，
#       自動偵測影片總長度並均勻輸出 180 幀桌機版 (1920px) 與手機輕量版 (1080px, 24fps 邏輯降載) WebP 序列幀。
#       輸出完成後，assets/mep-scroll-world.js 的併發佇列預載器會自動偵測並切換為真實序列幀渲染！
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
  echo "Frame 01 (RF 頂樓冷卻水塔): Top-down symmetrical view looking directly into a massive commercial FRP cooling tower fan intake on a Taipei skyscraper rooftop, stainless steel sprinkler head and blue chilled water pipes framing a deep central vertical shaft, 24mm wide-angle lens, f/2.8, industrial MEP engineering photography, dark cyan and amber volumetric lighting, photorealistic 8k, Octane Render --ar 16:9"
  echo "Frame 02 (3F-12F 商空冰水盤管): Inside a high-tech commercial ceiling plenum, symmetrical 4-way cassette fan coil unit and copper chilled water coil array forming a glowing central tunnel, 24mm wide-angle lens, f/2.8, industrial MEP engineering photography, dark cyan and amber volumetric lighting, photorealistic 8k, Octane Render --ar 16:9"
  echo "Frame 03 (MECH 機房泵閥核心): Symmetrical interior of an industrial mechanical room, heavy-duty cast iron centrifugal water pump, pillow block bearing and 8-inch gear-operated butterfly valve flange opening in dead center, 24mm wide-angle lens, f/2.8, industrial MEP engineering photography, dark cyan and amber volumetric lighting, photorealistic 8k, Octane Render --ar 16:9"
  echo "Frame 04 (B2 地下室 RC 蓄水池): Inside a pristine, spotless underground reinforced concrete water reservoir after high-pressure hydro-jetting, Omron 61F-G2 stainless steel electrode probe on wall, crystal clear water reflection, 24mm wide-angle lens, f/2.8, industrial MEP engineering photography, dark cyan and amber volumetric lighting, photorealistic 8k, Octane Render --ar 16:9"
  echo "圖生影片運鏡 Prompt (Kling / Runway / Luma Start+End Frame): Continuous smooth FPV dolly zoom forward through the center mechanical portal, seamless camera push-in movement, consistent lighting and geometry, no morphing artifacts, steady linear speed, cinematic motion."
  exit 0
fi

echo "[2/4] 無縫串接三段分鏡過渡影片..."
ffmpeg -y -f concat -safe 0 -i "$RAW_DIR/concat_list.txt" -c copy "$RAW_DIR/merged_mep_world.mp4"

# 自動計算影片總秒數並動態計算均勻抽幀率，確保不論影片 6 秒、9 秒或 15 秒都能完整涵蓋首尾不截斷
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$RAW_DIR/merged_mep_world.mp4")
TARGET_FPS=$(awk -v frames="$TOTAL_FRAMES" -v dur="$DURATION" 'BEGIN { if (dur <= 0) dur = 6; printf "%.4f", frames / dur }')
echo "偵測合併影片總長度：${DURATION}s，自動計算均勻抽幀率：${TARGET_FPS} fps（目標共 ${TOTAL_FRAMES} 幀）"

rm -f "$DESKTOP_OUT"/frame_*.webp "$MOBILE_OUT"/frame_*.webp

echo "[3/4] 轉出桌機版高畫質 WebP 序列幀 (1920px, 品質 80, 共 ${TOTAL_FRAMES} 幀)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4"   -vf "fps=${TARGET_FPS},scale=1920:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES"   -c:v libwebp -lossless 0 -compression_level 6 -q:v 80   "$DESKTOP_OUT/frame_%04d.webp"

echo "[4/4] 轉出手機端輕量防崩潰 WebP 序列幀 (1080px, 品質 72, 降低行動裝置記憶體佔用)..."
ffmpeg -y -i "$RAW_DIR/merged_mep_world.mp4"   -vf "fps=${TARGET_FPS},scale=1080:-1:flags=lanczos" -frames:v "$TOTAL_FRAMES"   -c:v libwebp -lossless 0 -compression_level 6 -q:v 72   "$MOBILE_OUT/frame_%04d.webp"

echo "完成！前端 mep-scroll-world.js 將自動透過併發預載佇列載入 WebP 序列幀。"
