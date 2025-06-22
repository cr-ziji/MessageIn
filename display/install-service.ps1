# MessageIn Windows服务安装脚本
# 需要以管理员权限运行

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Start,
    [switch]$Stop
)

$ServiceName = "MessageInProtector"
$ServiceDisplayName = "MessageIn Process Protector"
$ServiceDescription = "MessageIn应用进程保护服务，防止非法关闭应用"
$ScriptPath = Join-Path $PSScriptRoot "process-protection.js"
$NodePath = "node.exe"

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Service {
    if (-not (Test-Administrator)) {
        Write-Error "需要管理员权限来安装服务"
        return
    }

    try {
        # 检查服务是否已存在
        $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($existingService) {
            Write-Warning "服务已存在，正在卸载..."
            Uninstall-Service
        }

        # 创建服务
        $serviceArgs = @{
            Name = $ServiceName
            DisplayName = $ServiceDisplayName
            Description = $ServiceDescription
            BinaryPathName = "$NodePath `"$ScriptPath`""
            StartMode = "Automatic"
            StartupType = "Automatic"
        }

        New-Service @serviceArgs | Out-Null
        
        # 设置服务描述
        $service = Get-WmiObject -Class Win32_Service -Filter "Name='$ServiceName'"
        $service.Description = $ServiceDescription
        $service.Put() | Out-Null

        Write-Host "服务安装成功: $ServiceName" -ForegroundColor Green
        Write-Host "服务将在系统启动时自动运行" -ForegroundColor Yellow
        
    } catch {
        Write-Error "安装服务失败: $($_.Exception.Message)"
    }
}

function Uninstall-Service {
    if (-not (Test-Administrator)) {
        Write-Error "需要管理员权限来卸载服务"
        return
    }

    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -eq "Running") {
                Write-Host "正在停止服务..."
                Stop-Service -Name $ServiceName -Force
            }
            
            Write-Host "正在卸载服务..."
            $service | Remove-Service -Force
            
            Write-Host "服务卸载成功" -ForegroundColor Green
        } else {
            Write-Host "服务不存在" -ForegroundColor Yellow
        }
    } catch {
        Write-Error "卸载服务失败: $($_.Exception.Message)"
    }
}

function Start-Service {
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -eq "Running") {
                Write-Host "服务已在运行中" -ForegroundColor Yellow
            } else {
                Start-Service -Name $ServiceName
                Write-Host "服务启动成功" -ForegroundColor Green
            }
        } else {
            Write-Error "服务不存在，请先安装服务"
        }
    } catch {
        Write-Error "启动服务失败: $($_.Exception.Message)"
    }
}

function Stop-Service {
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -eq "Stopped") {
                Write-Host "服务已停止" -ForegroundColor Yellow
            } else {
                Stop-Service -Name $ServiceName -Force
                Write-Host "服务停止成功" -ForegroundColor Green
            }
        } else {
            Write-Error "服务不存在"
        }
    } catch {
        Write-Error "停止服务失败: $($_.Exception.Message)"
    }
}

# 主逻辑
if ($Install) {
    Install-Service
} elseif ($Uninstall) {
    Uninstall-Service
} elseif ($Start) {
    Start-Service
} elseif ($Stop) {
    Stop-Service
} else {
    Write-Host "MessageIn Windows服务管理脚本" -ForegroundColor Cyan
    Write-Host "用法:" -ForegroundColor White
    Write-Host "  -Install   安装服务" -ForegroundColor Yellow
    Write-Host "  -Uninstall 卸载服务" -ForegroundColor Yellow
    Write-Host "  -Start     启动服务" -ForegroundColor Yellow
    Write-Host "  -Stop      停止服务" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "示例:" -ForegroundColor White
    Write-Host "  .\install-service.ps1 -Install" -ForegroundColor Gray
    Write-Host "  .\install-service.ps1 -Start" -ForegroundColor Gray
} 