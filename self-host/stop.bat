@echo off
REM ============================================================================
REM  SoundDocs self-host -- STOP (Windows, double-clickable).
REM
REM  Cleanly stops all SoundDocs containers. Your data is kept safe -- it lives
REM  in Docker storage volumes and is NOT deleted by this. Start again any time
REM  by double-clicking start.bat.
REM ============================================================================
setlocal EnableExtensions

cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker isn't installed, so there's nothing to stop.
  goto :done
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker isn't running, so SoundDocs is already stopped.
  goto :done
)

echo Stopping SoundDocs ...
docker compose down
echo.
echo SoundDocs is stopped. Your data is safe.
echo Start it again by double-clicking start.bat.

:done
echo.
pause
endlocal
exit /b
