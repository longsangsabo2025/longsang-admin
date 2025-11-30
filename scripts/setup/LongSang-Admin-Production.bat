@echo off
title LongSang Admin - Starting All Services...
cd /d "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
powershell -ExecutionPolicy Bypass -File "start-all-services.ps1"
