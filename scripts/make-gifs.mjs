// Turns the recorded demo videos into GIFs for the README.
// Needs ffmpeg on the PATH (or set FFMPEG=/path/to/ffmpeg).
//
//   node scripts/make-gifs.mjs
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const videoDir = path.join('docs', 'media', 'videos');
const gifDir = path.join('docs', 'media', 'gifs');
mkdirSync(gifDir, { recursive: true });

for (const file of readdirSync(videoDir).filter((f) => f.endsWith('.webm'))) {
  const name = path.basename(file, '.webm');
  const input = path.join(videoDir, file);
  const output = path.join(gifDir, `${name}.gif`);
  const width = name.startsWith('mobile') ? 360 : 880;
  // Two-pass palette gives clean colours at a small size.
  const filters = `fps=10,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', input, '-vf', filters, '-loop', '0', output]);
  const kb = Math.round(statSync(output).size / 1024);
  console.log(`${output}  ${kb} KB`);
}
