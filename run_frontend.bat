@echo off
echo [Placement Management System]
echo Starting frontend server...

cd frontend
echo Installing missing frontend packages...
call npm install

echo Starting frontend server...
npm run dev

pause
