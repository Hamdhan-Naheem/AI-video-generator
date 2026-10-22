param([string]$ResumeRun)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $projectRoot
$sourceRoot = Join-Path $projectRoot 'm0\runs\electricity\gemini-live-phase2b-retry1'
$draftRoot = Join-Path $sourceRoot 'draft-4a'
$runRoot = if ($ResumeRun) { (Resolve-Path -LiteralPath $ResumeRun).Path } else { Join-Path $projectRoot ('m0\runs\phase6a-recovery\' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
$failedRoot = Join-Path $runRoot 'interrupted'
$recoveredRoot = Join-Path $runRoot 'recovered'
$scratchRoot = Join-Path $runRoot 'scratch'
New-Item -ItemType Directory -Path $failedRoot, $recoveredRoot, $scratchRoot -Force | Out-Null
$cli = Join-Path $projectRoot 'node_modules\@remotion\cli\remotion-cli.js'
$ffmpeg = Join-Path $projectRoot 'node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe'
$ffprobe = Join-Path $projectRoot 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$props = Join-Path $draftRoot 'render-props.json'
$audio = Join-Path $draftRoot 'audio-timeline.wav'
$candidate = Join-Path $sourceRoot 'candidate.json'
$approved = Join-Path $sourceRoot 'approved\8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10.json'
$originalAudio = Join-Path $sourceRoot 'narration\audio.mp3'
$alignment = Join-Path $sourceRoot 'narration\alignment.original.json'
$timing = Join-Path $draftRoot 'timeline.json'
$protected = @($candidate, $approved, $originalAudio, $alignment, $timing, $audio,
  (Join-Path $sourceRoot 'final-4b\electricity-final-1080x1920.mp4'),
  (Join-Path $projectRoot 'm0\runs\showcase-phase5c1\luma-mini-v1\narration\draft-narrated.mp4'),
  (Join-Path $projectRoot 'm0\runs\showcase-phase5c1\northstar-v2\narration\draft-narrated.mp4'))
$hashes = @{}
foreach ($path in $protected) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Saved recovery input is missing: $path" }
  $hashes[$path] = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
}
if ($hashes[$candidate] -ne '8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10' -or $hashes[$approved] -ne $hashes[$candidate]) { throw 'Approved script snapshot checksum mismatch' }
if ($hashes[$originalAudio] -ne 'a4da480bf6924abfcccae3b2d9d707e8d80685237daa69671d79b3a548e8e815') { throw 'Original narration audio checksum mismatch' }
try { $null = Get-Content -LiteralPath $alignment -Raw | ConvertFrom-Json; $null = Get-Content -LiteralPath $timing -Raw | ConvertFrom-Json; $null = Get-Content -LiteralPath $props -Raw | ConvertFrom-Json } catch { throw 'Saved alignment, timeline or render props contain malformed JSON' }
foreach ($tool in @($cli, $ffmpeg, $ffprobe)) { if (-not (Test-Path -LiteralPath $tool)) { throw "Local render tool is missing: $tool" } }

function Get-TreeSample([int]$rootPid) {
  $records = @(Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId -ErrorAction Stop)
  $ids = New-Object 'System.Collections.Generic.HashSet[int]'
  $null = $ids.Add($rootPid)
  do {
    $before = $ids.Count
    foreach ($record in $records) { if ($ids.Contains([int]$record.ParentProcessId)) { $null = $ids.Add([int]$record.ProcessId) } }
  } while ($ids.Count -gt $before)
  $cpu = 0.0; $memory = [int64]0
  foreach ($id in $ids) {
    $process = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($null -ne $process) { $cpu += [double]$process.CPU; $memory += [int64]$process.WorkingSet64 }
  }
  $files = @(Get-ChildItem -LiteralPath $runRoot -Recurse -File -ErrorAction SilentlyContinue)
  $disk = [int64]0
  foreach ($file in $files) { $disk += [int64]$file.Length }
  return @{cpuSeconds=$cpu; memoryBytes=$memory; runBytes=$disk; processCount=$ids.Count}
}

function Invoke-Render([string]$output, [string]$logPath, [bool]$interrupt) {
  $errorLog = "$logPath.stderr"
  $args = @($cli, 'render', 'm0/src/index.ts', 'ElectricityStoryboardDraft', $output,
    '--codec=h264', '--scale=0.5', '--concurrency=1', '--muted', '--frames=0-239',
    "--props=$props", '--env-file=.env.example', '--overwrite')
  $oldTemp = $env:TEMP; $oldTmp = $env:TMP
  $env:TEMP = $scratchRoot; $env:TMP = $scratchRoot
  try { $child = Start-Process -FilePath (Get-Command node).Source -ArgumentList $args -WorkingDirectory $projectRoot -RedirectStandardOutput $logPath -RedirectStandardError $errorLog -WindowStyle Hidden -PassThru }
  finally { $env:TEMP = $oldTemp; $env:TMP = $oldTmp }
  $watch = [System.Diagnostics.Stopwatch]::StartNew()
  $peakMemory = [int64]0; $peakRunBytes = [int64]0; $peakCpuPercentCore = 0.0; $lastCpu = $null; $lastSampleTime = $null
  $frame = 0; $interruptedAfterProgress = $false; $timedOut = $false
  try {
    while (-not $child.HasExited) {
      Start-Sleep -Milliseconds 700
      $sample = Get-TreeSample $child.Id
      $peakMemory = [Math]::Max($peakMemory, [int64]$sample.memoryBytes)
      $peakRunBytes = [Math]::Max($peakRunBytes, [int64]$sample.runBytes)
      if ($null -ne $lastCpu -and $null -ne $lastSampleTime) {
        $seconds = [Math]::Max(0.001, $watch.Elapsed.TotalSeconds - $lastSampleTime)
        $usage = [Math]::Max(0, ($sample.cpuSeconds - $lastCpu) / $seconds * 100)
        $peakCpuPercentCore = [Math]::Max($peakCpuPercentCore, $usage)
      }
      $lastCpu = $sample.cpuSeconds; $lastSampleTime = $watch.Elapsed.TotalSeconds
      if (Test-Path -LiteralPath $logPath) {
        $log = Get-Content -LiteralPath $logPath -Raw -ErrorAction SilentlyContinue
        if ($null -eq $log) { $log = '' }
        $matches = [regex]::Matches($log, 'Rendered\s+(\d+)\s*/\s*240')
        foreach ($match in $matches) { $frame = [Math]::Max($frame, [int]$match.Groups[1].Value) }
      }
      if ($interrupt -and $frame -ge 20 -and -not $child.HasExited) {
        $interruptedAfterProgress = $true
        & taskkill.exe /PID $child.Id /T /F | Out-Null
        break
      }
      if ($watch.Elapsed.TotalSeconds -gt 180) {
        $timedOut = $true
        if (-not $child.HasExited) { & taskkill.exe /PID $child.Id /T /F | Out-Null }
        break
      }
    }
    $child.WaitForExit(15000) | Out-Null
  } finally {
    if (-not $child.HasExited) { & taskkill.exe /PID $child.Id /T /F | Out-Null }
    $watch.Stop()
  }
  $exit = $child.ExitCode
  $bytes = if (Test-Path -LiteralPath $output) { (Get-Item -LiteralPath $output).Length } else { 0 }
  return @{elapsedSeconds=[Math]::Round($watch.Elapsed.TotalSeconds,3); lastRenderedFrame=$frame; interruptedAfterProgress=$interruptedAfterProgress; timedOut=$timedOut; exitCode=$exit; outputBytes=$bytes; peakProcessTreeWorkingSetBytes=$peakMemory; peakSampledCpuPercentOneCore=[Math]::Round($peakCpuPercentCore,1); peakRunDirectoryBytes=$peakRunBytes; log=$logPath; stderr=$errorLog}
}

$failedVideo = Join-Path $failedRoot 'video-only.mp4'
$recoveredVideo = Join-Path $recoveredRoot 'video-only.mp4'
$recoveredMp4 = Join-Path $recoveredRoot 'recovered-narrated-8s.mp4'
$reportPath = Join-Path $runRoot 'report.json'
$result = @{status='started'; runDirectory=$runRoot; durationSeconds=8; resolution='540x960'; fps=30; protectedHashes=$hashes}
try {
  if ($ResumeRun) {
    $previous = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    $result.interrupted = $previous.interrupted
    $result.recovered = $previous.recovered
    if (-not $result.interrupted -or -not $result.recovered) { throw 'Prior run does not contain both render attempts' }
  } else {
    $result.interrupted = Invoke-Render $failedVideo (Join-Path $failedRoot 'render.log') $true
  }
  if (-not $result.interrupted.interruptedAfterProgress) { throw 'No confirmed mid-render interruption; recovery proof is incomplete' }
  if ($result.interrupted.lastRenderedFrame -ge 240) { throw 'Render finished before interruption; recovery proof is incomplete' }
  if (Test-Path -LiteralPath $failedVideo) { throw 'Failed render produced a file; it must not be published or reused' }
  $result.status = 'interrupted'
  $result.failedOutputPublished = $false
  if (-not $ResumeRun) { $result.recovered = Invoke-Render $recoveredVideo (Join-Path $recoveredRoot 'render.log') $false }
  $recoveredLog = Join-Path $recoveredRoot 'render.log'
  if ($result.recovered.timedOut -or -not (Test-Path -LiteralPath $recoveredVideo) -or -not (Select-String -LiteralPath $recoveredLog -Pattern 'Encoded 240/240' -Quiet)) { throw 'Restarted local render failed; see recovered render log' }
  $muxWatch = [System.Diagnostics.Stopwatch]::StartNew()
  & $ffmpeg -nostdin -hide_banner -loglevel error -y -i $recoveredVideo -i $audio -map '0:v:0' -map '1:a:0' -c:v copy -c:a aac -b:a 192k -t 8 -movflags +faststart $recoveredMp4
  $muxExit = $LASTEXITCODE
  $muxWatch.Stop()
  if ($muxExit -ne 0) { throw "Recovered video audio mux failed with exit code $muxExit" }
  $probeText = & $ffprobe -v error -show_entries 'format=duration,size:stream=codec_name,width,height,r_frame_rate' -of json $recoveredMp4
  if ($LASTEXITCODE -ne 0) { throw 'Recovered video FFprobe failed' }
  $probe = $probeText | ConvertFrom-Json
  $videoStream = @($probe.streams | Where-Object { $_.codec_name -eq 'h264' })
  $audioStream = @($probe.streams | Where-Object { $_.codec_name -eq 'aac' })
  if ($videoStream.Count -ne 1 -or $audioStream.Count -ne 1 -or $videoStream[0].width -ne 540 -or $videoStream[0].height -ne 960 -or [Math]::Abs([double]$probe.format.duration - 8) -gt 0.08) { throw 'Recovered MP4 failed duration, dimensions or codec validation' }
  $result.muxSeconds = [Math]::Round($muxWatch.Elapsed.TotalSeconds,3)
  $result.probe = $probe
  $result.recoveredOutput = $recoveredMp4
  $result.recoveredOutputBytes = (Get-Item -LiteralPath $recoveredMp4).Length
  $result.recoveryMode = 'restart from first frame using saved approved assets; no partial-frame resume'
  $scratchFiles = @(Get-ChildItem -LiteralPath $scratchRoot -Recurse -File -ErrorAction SilentlyContinue)
  $scratchBytes = [int64]0
  foreach ($file in $scratchFiles) { $scratchBytes += [int64]$file.Length }
  $result.scratchBytesAtEnd = $scratchBytes
  $result.providerRequests = 0
  $result.status = 'recovered_and_validated'
} catch {
  $result.status = 'failed'
  $result.error = $_.Exception.Message
} finally {
  $result.protectedAssetsUnchanged = $true
  foreach ($path in $protected) {
    if (-not (Test-Path -LiteralPath $path) -or (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant() -ne $hashes[$path]) { $result.protectedAssetsUnchanged = $false }
  }
  if (-not $result.protectedAssetsUnchanged) { $result.status = 'failed'; $result.error = 'A protected approved asset changed during the test' }
  $result | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath $reportPath -Encoding UTF8
  Write-Output "Report: $reportPath"
  Write-Output "Status: $($result.status)"
  if ($result.error) { Write-Error $result.error }
}
if ($result.status -ne 'recovered_and_validated') { exit 1 }
