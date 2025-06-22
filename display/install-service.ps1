param(
    [Parameter(Mandatory=$false)][switch]$Uninstall = $false
)

$serviceName = "MessageInProtector"
$exePath = Join-Path $PSScriptRoot 'dist\win-unpacked\MessageIn-Display.exe'

if ($Uninstall) {
    Write-Host "正在卸载服务..."
    sc.exe stop $serviceName | Out-Null
    sc.exe delete $serviceName | Out-Null
    Write-Host "服务已卸载。"
    exit 0
}

if (-not (Test-Path $exePath)) {
    Write-Host "未找到主程序: $exePath"
    exit 1
}

Write-Host "正在注册服务..."
sc.exe create $serviceName binPath= '"' + $exePath + '"' start= auto DisplayName= "MessageIn守护服务" | Out-Null
sc.exe description $serviceName "MessageIn应用进程守护服务" | Out-Null
sc.exe start $serviceName | Out-Null
Write-Host "服务已注册并启动。" 