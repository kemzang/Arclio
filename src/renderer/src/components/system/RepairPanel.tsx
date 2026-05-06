import type { JSX } from 'react';
import { AlertTriangle, FolderOpen, RefreshCw, FileSearch } from 'lucide-react';
import type { DependencyDiagnostic, DependencyFailureKind, DependencyId } from '@shared/types';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';

interface Props {
  diagnostics: Record<DependencyId, DependencyDiagnostic>;
  blocking: DependencyId[];
}

const FAILURE_HINT: Record<DependencyFailureKind, string> = {
  download_failed: 'Download failed. Check your internet connection and retry.',
  extract_failed: 'Archive extraction failed. The download may be corrupt — retry.',
  hash_failed: 'Checksum mismatch on the downloaded file. Retry the download.',
  spawn_failed: 'The file is missing or could not be launched. Pick a working copy.',
  permission_denied: 'Windows refused to run the file. Pick a copy you trust or retry as admin.',
  blocked_or_quarantined: 'Windows blocked the file (SmartScreen / Defender). Pick an installed copy or whitelist the runtime folder.',
  bad_exit_code: 'The binary did not respond to --version. It may be corrupt or the wrong build.',
  timeout: 'The version probe timed out. The file may be hung — retry.',
  pair_incomplete: 'ffmpeg and ffprobe must both be set as a matched pair.'
};

const DEPENDENCY_LABEL: Record<DependencyId, string> = {
  'yt-dlp': 'yt-dlp',
  ffmpeg: 'FFmpeg',
  ffprobe: 'FFprobe',
  deno: 'Deno'
};

export function RepairPanel({ diagnostics, blocking }: Props): JSX.Element {
  const repairWarmup = useAppStore((s) => s.repairWarmup);
  const setBinaryOverride = useAppStore((s) => s.setBinaryOverride);
  const openBinariesDir = useAppStore((s) => s.openBinariesDir);
  const openLogs = useAppStore((s) => s.openLogs);
  const warmupRunning = useAppStore((s) => s.warmupRunning);

  async function pickAndOverride(id: DependencyId): Promise<void> {
    const result = await window.appApi.dialog.chooseExecutable(id);
    if (!result.ok || !result.data.path) return;
    await setBinaryOverride(id, result.data.path);
  }

  return (
    <div className="repair-panel mt-4 max-w-md">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle size={16} />
        <span className="font-medium">Setup needs your help</span>
      </div>
      <ul className="mt-3 space-y-3 text-left text-sm">
        {blocking.map((id) => {
          const diag = diagnostics[id];
          const hint = diag.failure ? FAILURE_HINT[diag.failure.kind] : 'Could not be verified.';
          return (
            <li key={id} className="rounded border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{DEPENDENCY_LABEL[id]}</span>
                <span className="text-xs text-muted-foreground">{diag.failure?.kind ?? 'failed'}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void pickAndOverride(id)} disabled={warmupRunning}>
                  <FileSearch size={14} /> Choose executable
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void repairWarmup()} disabled={warmupRunning}>
          <RefreshCw size={14} /> Retry setup
        </Button>
        <Button size="sm" variant="outline" onClick={() => void openBinariesDir()}>
          <FolderOpen size={14} /> Open dependency folder
        </Button>
        <Button size="sm" variant="outline" onClick={() => void openLogs()}>
          View setup log
        </Button>
      </div>
    </div>
  );
}
