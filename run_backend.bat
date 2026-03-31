@echo off
echo [Placement Management System]
echo Bypassing GTKWave Python Engine...

rem Strip out the broken GTKWave path from the current active session
set "PATH=%PATH:C:\iverilog\gtkwave\bin;=%"
set "PATH=%PATH:C:\iverilog\gtkwave\bin=%"
set "PATH=%PATH:C:\iverilog\bin;=%"
set "PATH=%PATH:C:\iverilog\bin=%"

rem Force the newly installed Python 3.12 path to take highest priority
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312\Scripts\;%LOCALAPPDATA%\Programs\Python\Python312\;%PATH%"

cd backend
echo Installing any missing python packages...
pip install -r requirements.txt --quiet --disable-pip-version-check

echo Running database configurations...
python ..\database\create_test_users.py

echo Starting backend server on Port 5000...
python app.py

pause
