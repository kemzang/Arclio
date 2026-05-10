// electron-builder lifecycle hook. Fires once per (platform, arch) the build
// targets. Invokes scripts/build/fetch-embedded.sh to populate
// build/embedded/<platform>-<arch>/{ffmpeg, ffprobe}[.exe] before the
// extraResources copy step packs them into the artifact.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// electron-builder Arch enum: 0=ia32, 1=x64, 2=armv7l, 3=arm64
const ARCH_NAMES = ['ia32', 'x64', 'armv7l', 'arm64'];

export default async function beforeBuild(context) {
  const platform = context.platform.nodeName; // 'win32' | 'darwin' | 'linux'
  // context.arch reflects the host arch in cross-compile scenarios (e.g. --arm64
  // flag on an x64 runner) rather than the target arch. Log the raw value so
  // mismatches are visible. The dist:mac:*:dir scripts pre-fetch the correct
  // arch explicitly, so this hook is the fallback for non-dir builds.
  const archName = ARCH_NAMES[context.arch] ?? (process.arch === 'arm64' ? 'arm64' : 'x64');
  console.log(`[beforeBuild] context.arch=${context.arch} → ${archName} (host=${process.arch})`);
  const cwd = context.appDir ?? process.cwd();
  const script = path.join(cwd, 'scripts', 'build', 'fetch-embedded.sh');
  console.log(`[beforeBuild] fetch ffmpeg/ffprobe for ${platform}-${archName} (context.arch=${context.arch}, host=${process.arch})`);
  execFileSync('bash', [script, platform, archName], { stdio: 'inherit', cwd });
  // Returning falsy here makes electron-builder treat node_modules as
  // "handled externally" and skip the prod-deps install/copy entirely
  // (app-builder-lib/out/packager.js — _nodeModulesHandledExternally),
  // which produces an asar with zero node_modules.
  return true;
}
