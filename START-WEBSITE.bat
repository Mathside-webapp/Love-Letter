@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto python
py start_website.py
goto end
:python
where python >nul 2>nul
if errorlevel 1 goto missing
python start_website.py
goto end
:missing
echo Python is not installed. Use GitHub Pages or install Python 3.
:end
pause
