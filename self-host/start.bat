@echo off
REM ============================================================================
REM  SoundDocs self-host -- one-action START (Windows, double-clickable).
REM
REM  What this does, in order:
REM    1. Checks Docker is installed AND running (friendly message + link if not).
REM    2. If self-host\.env doesn't exist yet, generates one with strong random
REM       secrets and the derived Supabase ANON_KEY / SERVICE_ROLE_KEY. It NEVER
REM       overwrites an existing .env.
REM    3. Starts the whole stack: docker compose up -d --build
REM    4. Waits until the one-shot `supabase-migrate` service finishes applying
REM       the database migrations (first run can take a few minutes).
REM    5. Opens your browser to the SoundDocs app.
REM    6. Prints the dashboard URL + username/password.
REM
REM  HOW SECRETS ARE MADE ON WINDOWS (honest note):
REM    Windows has no built-in openssl or bash, so we do NOT rely on them.
REM    - Random secrets come from PowerShell's secure random generator.
REM    - The Supabase ANON_KEY / SERVICE_ROLE_KEY are real signed JWTs, created
REM      by running a tiny Node container (node:20-alpine) via Docker -- which is
REM      already installed. This produces the exact same JWT format setup.sh
REM      makes on Mac/Linux, so the stack behaves identically.
REM
REM  Safe to run more than once: it keeps your existing .env.
REM ============================================================================
setlocal EnableExtensions EnableDelayedExpansion

REM --- Always operate from THIS script's own folder (self-host\) --------------
cd /d "%~dp0"

set "DOCKER_URL=https://www.docker.com/products/docker-desktop/"
set "ENV_FILE=%~dp0.env"

REM --- 1. Docker checks -------------------------------------------------------
where docker >nul 2>&1
if errorlevel 1 (
  echo ------------------------------------------------------------
  echo Docker is not installed.
  echo.
  echo SoundDocs self-hosting needs Docker Desktop. It's a free download:
  echo   %DOCKER_URL%
  echo.
  echo Install it, open it ^(wait for the whale icon to say it's running^),
  echo then run this again.
  echo ------------------------------------------------------------
  goto :pause_exit
)

docker info >nul 2>&1
if errorlevel 1 (
  echo ------------------------------------------------------------
  echo Docker is installed, but it doesn't look like it's running.
  echo.
  echo Please OPEN Docker Desktop and wait until it says it's running
  echo ^(the whale icon stops animating^), then run this again.
  echo.
  echo Don't have it? Get it here: %DOCKER_URL%
  echo ------------------------------------------------------------
  goto :pause_exit
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo ------------------------------------------------------------
  echo Your Docker is missing "docker compose" ^(v2^).
  echo.
  echo Update Docker Desktop to the latest version, then run this again:
  echo   %DOCKER_URL%
  echo ------------------------------------------------------------
  goto :pause_exit
)

REM --- 2. Generate .env once (idempotent) -------------------------------------
if exist "%ENV_FILE%" (
  echo Found your existing settings ^(.env^) -- keeping them as-is.
) else (
  echo First time here -- creating your settings with strong random passwords ...
  call :generate_env
  if errorlevel 1 (
    echo ERROR: Could not create the settings file. See messages above.
    goto :pause_exit
  )
)

REM --- 3. Start everything ----------------------------------------------------
echo ------------------------------------------------------------
echo Starting SoundDocs ...
echo The FIRST run downloads images and builds the app -- this can take a few
echo minutes. Later runs are much faster. Please be patient.
echo ------------------------------------------------------------
docker compose up -d --build
if errorlevel 1 (
  echo ERROR: Docker could not start the stack. See messages above.
  goto :pause_exit
)

REM --- 4. Wait for the migrations to finish -----------------------------------
echo.
echo Setting up the database ^(this part can take a few minutes on first run^) ...

set "MIGRATE_CONTAINER=supabase-migrate"
set /a WAITED=0
set /a MAX_WAIT=900
set "EXIT_CODE="

:wait_loop
for /f "usebackq delims=" %%S in (`docker inspect -f "{{.State.Status}}" %MIGRATE_CONTAINER% 2^>nul`) do set "STATE=%%S"
if "%STATE%"=="exited" goto :wait_done
if "%STATE%"=="dead" goto :wait_done
if %WAITED% GEQ %MAX_WAIT% (
  echo.
  echo The database setup is taking longer than expected.
  echo It may still finish on its own. You can watch progress with:
  echo   docker compose logs -f supabase-migrate
  goto :after_wait
)
<nul set /p "=."
REM Sleep ~5 seconds without extra dependencies.
ping -n 6 127.0.0.1 >nul
set /a WAITED+=5
goto :wait_loop

:wait_done
for /f "usebackq delims=" %%C in (`docker inspect -f "{{.State.ExitCode}}" %MIGRATE_CONTAINER% 2^>nul`) do set "EXIT_CODE=%%C"
echo.
if "%EXIT_CODE%"=="0" (
  echo Database is ready.
) else (
  echo Note: database setup reported a problem ^(code %EXIT_CODE%^).
  echo See what happened with:  docker compose logs supabase-migrate
)

:after_wait
REM --- 5. Read ports + dashboard login from .env ------------------------------
set "WEB_PORT=3000"
set "KONG_HTTP_PORT=8000"
set "DASHBOARD_USERNAME=supabase"
set "DASHBOARD_PASSWORD=(see self-host\.env)"

for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  if /i "%%A"=="WEB_PORT" if not "%%B"=="" set "WEB_PORT=%%B"
  if /i "%%A"=="KONG_HTTP_PORT" if not "%%B"=="" set "KONG_HTTP_PORT=%%B"
  if /i "%%A"=="DASHBOARD_USERNAME" if not "%%B"=="" set "DASHBOARD_USERNAME=%%B"
  if /i "%%A"=="DASHBOARD_PASSWORD" if not "%%B"=="" set "DASHBOARD_PASSWORD=%%B"
)

set "APP_URL=http://localhost:%WEB_PORT%"
set "STUDIO_URL=http://localhost:%KONG_HTTP_PORT%"

REM --- 6. Open the browser ----------------------------------------------------
echo.
echo Opening SoundDocs in your browser: %APP_URL%
start "" "%APP_URL%"

REM --- 7. Final summary -------------------------------------------------------
echo ------------------------------------------------------------
echo SoundDocs is running!
echo.
echo   SoundDocs app:     %APP_URL%
echo   Admin dashboard:   %STUDIO_URL%
echo        username:     %DASHBOARD_USERNAME%
echo        password:     %DASHBOARD_PASSWORD%
echo.
echo If the page is blank, give it another minute ^(the app may still be
echo building^) and refresh.
echo.
echo To stop SoundDocs later, double-click stop.bat.
echo ------------------------------------------------------------

:pause_exit
echo.
pause
endlocal
exit /b

REM ============================================================================
REM  :generate_env  -- writes a fresh .env with strong secrets + signed JWTs.
REM  Uses PowerShell for randomness and a tiny Node container for JWT signing.
REM  Mirrors what setup.sh produces on Mac/Linux (same var names + format).
REM ============================================================================
:generate_env
  REM 1) Random hex secrets via PowerShell's secure RNG.
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$b=New-Object byte[] 24;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);($b|ForEach-Object {$_.ToString('x2')}) -join ''"`) do set "POSTGRES_PASSWORD=%%P"
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$b=New-Object byte[] 12;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);($b|ForEach-Object {$_.ToString('x2')}) -join ''"`) do set "DASHBOARD_PASSWORD=%%P"
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$b=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);($b|ForEach-Object {$_.ToString('x2')}) -join ''"`) do set "SECRET_KEY_BASE=%%P"
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$b=New-Object byte[] 24;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);($b|ForEach-Object {$_.ToString('x2')}) -join ''"`) do set "JWT_SECRET=%%P"

  if not defined JWT_SECRET (
    echo ERROR: Could not generate random secrets with PowerShell.
    exit /b 1
  )

  REM 2) Sign the two Supabase JWTs in a tiny Node container (Docker is present).
  REM    Node prints "ANON_KEY|SERVICE_ROLE_KEY" on one line; we split on "|".
  echo Generating Supabase API keys ^(downloads a tiny helper image once^) ...
  set "KEYS="
  for /f "usebackq delims=" %%K in (`docker run --rm -e JWT_SECRET=%JWT_SECRET% node:20-alpine node -e "const c=require('crypto');const s=process.env.JWT_SECRET;const b64=o=>Buffer.from(o).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const iat=Math.floor(Date.now()/1000);const exp=iat+5*365*24*3600;const sign=role=>{const h=b64(JSON.stringify({alg:'HS256',typ:'JWT'}));const p=b64(JSON.stringify({role,iss:'supabase',iat,exp}));const d=h+'.'+p;const sig=c.createHmac('sha256',s).update(d).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return d+'.'+sig;};process.stdout.write(sign('anon')+'|'+sign('service_role'));"`) do set "KEYS=%%K"

  if not defined KEYS (
    echo ERROR: Could not generate the Supabase API keys via Docker.
    echo        Make sure Docker is running and can pull node:20-alpine.
    exit /b 1
  )
  for /f "tokens=1,2 delims=|" %%a in ("!KEYS!") do (
    set "ANON_KEY=%%a"
    set "SERVICE_ROLE_KEY=%%b"
  )

  REM 3) Fixed config (matches setup.sh defaults).
  set "KONG_HTTP_PORT=8000"
  set "WEB_PORT=3000"
  set "PUBLIC_URL=http://localhost:8000"
  set "SITE_URL=http://localhost:3000"

  REM 4) Write .env (UTF-8, no BOM via PowerShell would be ideal, but plain
  REM    redirection is fine here since all values are ASCII).
  echo Writing settings file ...
  (
    echo # Generated by start.bat on %DATE% %TIME%
    echo # Do NOT share this file -- it contains your private passwords.
    echo.
    echo ############################################################
    echo # SECRETS
    echo ############################################################
    echo POSTGRES_PASSWORD=!POSTGRES_PASSWORD!
    echo JWT_SECRET=!JWT_SECRET!
    echo ANON_KEY=!ANON_KEY!
    echo SERVICE_ROLE_KEY=!SERVICE_ROLE_KEY!
    echo SECRET_KEY_BASE=!SECRET_KEY_BASE!
    echo DASHBOARD_USERNAME=supabase
    echo DASHBOARD_PASSWORD=!DASHBOARD_PASSWORD!
    echo.
    echo ############################################################
    echo # WEB APP ^(baked into the bundle at build time^)
    echo ############################################################
    echo VITE_SUPABASE_URL=!PUBLIC_URL!
    echo VITE_SUPABASE_ANON_KEY=!ANON_KEY!
    echo WEB_PORT=!WEB_PORT!
    echo.
    echo ############################################################
    echo # PUBLIC URLS
    echo ############################################################
    echo SUPABASE_PUBLIC_URL=!PUBLIC_URL!
    echo API_EXTERNAL_URL=!PUBLIC_URL!
    echo SITE_URL=!SITE_URL!
    echo ADDITIONAL_REDIRECT_URLS=
    echo.
    echo ############################################################
    echo # DATABASE
    echo ############################################################
    echo POSTGRES_HOST=db
    echo POSTGRES_DB=postgres
    echo POSTGRES_PORT=5432
    echo.
    echo ############################################################
    echo # KONG PORTS
    echo ############################################################
    echo KONG_HTTP_PORT=!KONG_HTTP_PORT!
    echo KONG_HTTPS_PORT=8443
    echo.
    echo ############################################################
    echo # AUTH
    echo ############################################################
    echo JWT_EXPIRY=3600
    echo DISABLE_SIGNUP=false
    echo ENABLE_EMAIL_SIGNUP=true
    echo ENABLE_EMAIL_AUTOCONFIRM=true
    echo ENABLE_ANONYMOUS_USERS=false
    echo ENABLE_PHONE_SIGNUP=false
    echo ENABLE_PHONE_AUTOCONFIRM=false
    echo SMTP_ADMIN_EMAIL=admin@example.com
    echo SMTP_HOST=supabase-mail
    echo SMTP_PORT=2500
    echo SMTP_USER=fake_mail_user
    echo SMTP_PASS=fake_mail_password
    echo SMTP_SENDER_NAME=fake_sender
    echo MAILER_URLPATHS_INVITE=/auth/v1/verify
    echo MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
    echo MAILER_URLPATHS_RECOVERY=/auth/v1/verify
    echo MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify
    echo.
    echo ############################################################
    echo # EDGE FUNCTIONS
    echo ############################################################
    echo FUNCTIONS_VERIFY_JWT=false
    echo.
    echo ############################################################
    echo # POSTGREST
    echo ############################################################
    echo PGRST_DB_SCHEMAS=public,storage,graphql_public
    echo.
    echo ############################################################
    echo # STORAGE
    echo ############################################################
    echo STORAGE_TENANT_ID=stub
    echo REGION=stub
    echo GLOBAL_S3_BUCKET=stub
    echo.
    echo ############################################################
    echo # STUDIO
    echo ############################################################
    echo STUDIO_DEFAULT_ORGANIZATION=SoundDocs
    echo STUDIO_DEFAULT_PROJECT=SoundDocs
    echo.
    echo ############################################################
    echo # IMGPROXY
    echo ############################################################
    echo IMGPROXY_AUTO_WEBP=true
  ) > "%ENV_FILE%"

  echo Settings file created.
  exit /b 0
