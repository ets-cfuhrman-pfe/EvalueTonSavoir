@echo off
setlocal EnableDelayedExpansion

:: Check if gh is installed
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo GitHub CLI not found. Installing...
    winget install --id GitHub.cli
    if %errorlevel% neq 0 (
        echo Failed to install GitHub CLI. Exiting...
        exit /b 1
    )
    echo GitHub CLI installed successfully.
)

:: Check if user is authenticated
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo GitHub CLI not authenticated. Please authenticate...
    gh auth login
    if %errorlevel% neq 0 (
        echo Failed to authenticate. Exiting...
        exit /b 1
    )
    echo Authentication successful.
)

:: Get the current branch name
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH_NAME=%%i

:: Run the GitHub workflow with the current branch name
echo Running GitHub workflow with branch %BRANCH_NAME%...
gh workflow run 119194149 --ref %BRANCH_NAME%

:: Wait and validate workflow launch
set /a attempts=0
set /a max_attempts=12
echo Waiting for workflow to start...

:wait_for_workflow
timeout /t 15 >nul
set /a attempts+=1

:: Get recent workflow run matching our criteria with in_progress status
for /f "tokens=*" %%i in ('gh run list --branch %BRANCH_NAME% --status in_progress --limit 1 --json databaseId --jq ".[0].databaseId"') do set WORKFLOW_RUN_ID=%%i

if "%WORKFLOW_RUN_ID%"=="" (
    if !attempts! lss !max_attempts! (
        echo Attempt !attempts! of !max_attempts!: No running workflow found yet...
        goto wait_for_workflow
    ) else (
        echo Timeout waiting for workflow to start running.
        exit /b 1
    )
)

echo Found running workflow ID: %WORKFLOW_RUN_ID%

:monitor_progress
cls
echo Workflow Progress:
echo ----------------
gh run view %WORKFLOW_RUN_ID% --json jobs --jq ".jobs[] | \"Job: \" + .name + \" - Status: \" + .status + if .conclusion != null then \" (\" + .conclusion + \")\" else \"\" end"
echo.

:: Check if workflow is still running
for /f "tokens=*" %%i in ('gh run view %WORKFLOW_RUN_ID% --json status --jq ".status"') do set CURRENT_STATUS=%%i
if "%CURRENT_STATUS%" == "completed" (
    echo Workflow completed.
    exit /b 0
)

timeout /t 5 >nul
goto monitor_progress