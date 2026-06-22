# SecMind 一键启动脚本
# 用法: powershell -ExecutionPolicy Bypass -File C:\SecMind\start.ps1

$MYSQLD   = "C:\Program Files\MariaDB 12.2\bin\mysqld.exe"
$MYINI    = "C:\Program Files\MariaDB 12.2\data\my.ini"
$SECMIND  = "C:\SecMind\server.js"

# 1. 确保 MariaDB 在运行
$port3306 = netstat -ano | Select-String ":3306 "
if (-not $port3306) {
    Write-Host "[db]  启动 MariaDB..." -ForegroundColor Cyan
    Start-Process -FilePath $MYSQLD -ArgumentList "--defaults-file=`"$MYINI`"","--console" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "[db]  MariaDB 已启动 (port 3306)" -ForegroundColor Green
} else {
    Write-Host "[db]  MariaDB 已在运行 (port 3306)" -ForegroundColor Green
}

# 2. 启动 SecMind 服务
Write-Host "[app] 启动 SecMind..." -ForegroundColor Cyan
node $SECMIND
