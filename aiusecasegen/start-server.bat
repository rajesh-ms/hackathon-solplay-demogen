@echo off
cd /d "C:\learn\demoable-solplay\hackathon-solplay-demogen\aiusecasegen"
echo Starting Next.js development server...
echo Current directory: %CD%
npx next dev --turbopack
pause