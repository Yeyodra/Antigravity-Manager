@echo off
echo Setting up build environment...

set PATH=%PATH%;C:\Program Files\NASM;C:\Program Files\LLVM\bin
set LIBCLANG_PATH=C:\Program Files\LLVM\bin

REM Find CMake from Visual Studio
for /f "delims=" %%i in ('dir /s /b "C:\Program Files\Microsoft Visual Studio\*cmake.exe" 2^>nul ^| findstr /i "CMake\\bin\\cmake.exe"') do (
    for %%j in ("%%~dpi.") do set "CMAKE_DIR=%%~dpj"
    goto :found_cmake
)
echo ERROR: CMake not found in Visual Studio installation
pause
exit /b 1

:found_cmake
set PATH=%PATH%;%CMAKE_DIR%

echo.
echo Verifying tools:
where nasm 2>nul && echo   [OK] NASM found || echo   [FAIL] NASM not found
where cmake 2>nul && echo   [OK] CMake found || echo   [FAIL] CMake not found
where libclang.dll 2>nul && echo   [OK] libclang found || (if exist "%LIBCLANG_PATH%\libclang.dll" (echo   [OK] libclang found at %LIBCLANG_PATH%) else (echo   [FAIL] libclang not found))
echo.

echo Starting Tauri dev...
npm run tauri dev
pause
