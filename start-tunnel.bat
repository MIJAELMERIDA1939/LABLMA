@echo off
title SGC Tunnel - LocalTunnel
cd /d C:\LABUGRAM\sgc\frontend
echo ========================================
echo  SGC - Tunnel Publico (LocalTunnel)
echo ========================================
echo.
echo  Cargando... (esto puede tomar unos segundos)
echo  Cuando veas "your url is:" abajo, la URL es tu acceso publico.
echo.
echo  NOTA: No cierres esta ventana mientras quieras el tunel activo.
echo.
"C:\Program Files\nodejs\npx.cmd" localtunnel --port 3000
echo.
echo  El tunel se cerro. Presiona ENTER para salir.
pause
