param()

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $projectRoot
$runRoot = Join-Path $projectRoot ('m0\runs\phase6b-subtitles\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
$cli = Join-Path $projectRoot 'node_modules\@remotion\cli\remotion-cli.js'
$ffmpeg = Join-Path $projectRoot 'node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe'
$ffprobe = Join-Path $projectRoot 'node_modules\@remotion\compositor-win32-x64-msvc\ffprobe.exe'
$electricity = Join-Path $projectRoot 'm0\runs\electricity\gemini-live-phase2b-retry1\draft-4a'
$luma = Join-Path $projectRoot 'm0\runs\showcase-phase5c1\luma-mini-v1\narration'
$northstar = Join-Path $projectRoot 'm0\runs\showcase-phase5c1\northstar-v2\narration'
$cases = @(
  @{name='electricity'; composition='ElectricityStoryboardDraft'; props=(Join-Path $electricity 'render-props.json'); frame=60},
  @{name='luma'; composition='ProductShowcaseDemo'; props=(Join-Path $luma 'render-props.json'); frame=210},
  @{name='northstar'; composition='SoftwareExplainerDemo'; props=(Join-Path $northstar 'render-props.json'); frame=390}
)
$report = @{status='started'; runDirectory=$runRoot; cases=@(); electricityAudioSource=(Join-Path $electricity 'audio-timeline.wav'); providerRequests=0}
try {
  foreach ($case in $cases) {
    $base = Get-Content -LiteralPath $case.props -Raw | ConvertFrom-Json
    $sourceHash = (Get-FileHash -LiteralPath $case.props -Algorithm SHA256).Hash.ToLowerInvariant()
    $modeResults = @()
    foreach ($mode in @('on','off')) {
      $copy = $base.PSObject.Copy()
      $copy | Add-Member -NotePropertyName showSubtitles -NotePropertyValue ($mode -eq 'on') -Force
      $copy | Add-Member -NotePropertyName includeAudio -NotePropertyValue $false -Force
      $propsPath = Join-Path $runRoot "$($case.name)-$mode-props.json"
      [System.IO.File]::WriteAllText($propsPath, ($copy | ConvertTo-Json -Depth 100), (New-Object System.Text.UTF8Encoding($false)))
      $still = Join-Path $runRoot "$($case.name)-$mode.png"
      & node $cli still m0/src/index.ts $case.composition $still "--frame=$($case.frame)" --scale=0.5 "--props=$propsPath" --env-file=.env.example --log=error --overwrite
      if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $still)) { throw "Subtitle $mode still failed for $($case.name)" }
      $upper = Join-Path $runRoot "$($case.name)-$mode-upper.png"
      & $ffmpeg -nostdin -hide_banner -loglevel error -y -i $still -vf 'crop=540:350:0:0' -frames:v 1 $upper
      if ($LASTEXITCODE -ne 0) { throw "Upper visual crop failed for $($case.name)" }
      $modeResults += @{mode=$mode; still=$still; stillSha256=(Get-FileHash -LiteralPath $still -Algorithm SHA256).Hash.ToLowerInvariant(); upperSha256=(Get-FileHash -LiteralPath $upper -Algorithm SHA256).Hash.ToLowerInvariant()}
    }
    if ($modeResults[0].stillSha256 -eq $modeResults[1].stillSha256) { throw "Subtitle panel did not change for $($case.name)" }
    if ($modeResults[0].upperSha256 -ne $modeResults[1].upperSha256) { throw "Scene visuals outside subtitle area changed for $($case.name)" }
    if ((Get-FileHash -LiteralPath $case.props -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sourceHash) { throw "Saved render props changed for $($case.name)" }
    $report.cases += @{name=$case.name; frame=$case.frame; modes=$modeResults; upperVisualsIdentical=$true; subtitleRegionChanged=$true; savedPropsUnchanged=$true}
  }

  $variants = @()
  foreach ($mode in @('on','off')) {
    $props = Join-Path $runRoot "electricity-$mode-props.json"
    $videoOnly = Join-Path $runRoot "electricity-$mode-video-only.mp4"
    $muxed = Join-Path $runRoot "electricity-$mode-narrated.mp4"
    & node $cli render m0/src/index.ts ElectricityStoryboardDraft $videoOnly --codec=h264 --scale=0.5 --concurrency=2 --muted --frames=45-104 "--props=$props" --env-file=.env.example --log=error --overwrite
    if ($LASTEXITCODE -ne 0) { throw "Subtitle $mode sample render failed" }
    & $ffmpeg -nostdin -hide_banner -loglevel error -y -i $videoOnly -ss 1.5 -i $report.electricityAudioSource -map '0:v:0' -map '1:a:0' -c:v copy -c:a aac -b:a 192k -t 2 -movflags +faststart $muxed
    if ($LASTEXITCODE -ne 0) { throw "Subtitle $mode sample mux failed" }
    $probeText = & $ffprobe -v error -show_entries 'format=duration:stream=codec_name,width,height,r_frame_rate' -of json $muxed
    if ($LASTEXITCODE -ne 0) { throw "Subtitle $mode sample probe failed" }
    $probe = $probeText | ConvertFrom-Json
    if ([Math]::Abs([double]$probe.format.duration - 2) -gt 0.08 -or -not @($probe.streams | Where-Object codec_name -EQ 'aac') -or -not @($probe.streams | Where-Object codec_name -EQ 'h264')) { throw "Subtitle $mode sample format or audio is invalid" }
    $aac = Join-Path $runRoot "electricity-$mode-audio.aac"
    & $ffmpeg -nostdin -hide_banner -loglevel error -y -i $muxed -map '0:a:0' -c copy -f adts $aac
    if ($LASTEXITCODE -ne 0) { throw "Subtitle $mode audio extraction failed" }
    $variants += @{mode=$mode; video=$muxed; audioSha256=(Get-FileHash -LiteralPath $aac -Algorithm SHA256).Hash.ToLowerInvariant(); durationSeconds=[double]$probe.format.duration; audioCodec='aac'; videoCodec='h264'}
  }
  if ($variants[0].audioSha256 -ne $variants[1].audioSha256) { throw 'Subtitle off changed the muxed narration audio' }
  $report.variants = $variants
  $report.audioTracksIdentical = $true
  $report.status = 'validated'
} catch {
  $report.status = 'failed'
  $report.error = $_.Exception.Message
} finally {
  $reportPath = Join-Path $runRoot 'report.json'
  $report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $reportPath -Encoding UTF8
  Write-Output "Report: $reportPath"
  Write-Output "Status: $($report.status)"
  if ($report.error) { Write-Error $report.error }
}
if ($report.status -ne 'validated') { exit 1 }
