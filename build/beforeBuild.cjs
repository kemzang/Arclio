// electron-builder lifecycle hook. Fires once per (platform, arch) the build
// targets. Invokes scripts/build/fetch-embedded.sh to populate
// build/embedded/<platform>-<arch>/{ffmpeg, ffprobe}[.exe] before the
// extraResources copy step packs them into the artifact.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// electron-builder Arch enum: 0=ia32, 1=x64, 2=armv7l, 3=arm64
const ARCH_NAMES = ['ia32', 'x64', 'armv7l', 'arm64'];

exports.default = async function beforeBuild(context) {
  const platform = context.platform.nodeName; // 'win32' | 'darwin' | 'linux'
  const archName = ARCH_NAMES[context.arch] ?? 'x64';
  const cwd = context.appDir ?? process.cwd();
  const script = path.join(cwd, 'scripts', 'build', 'fetch-embedded.sh');
  console.log(`[beforeBuild] fetch ffmpeg/ffprobe for ${platform}-${archName}`);
  execFileSync('bash', [script, platform, archName], { stdio: 'inherit', cwd });
};
