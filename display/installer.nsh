!macro customInstall
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" install MessageInProtector "powershell.exe" -ExecutionPolicy Bypass -File "$INSTDIR\\process-protection.ps1"'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" set MessageInProtector DisplayName "MessageInProtector"'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" set MessageInProtector Start SERVICE_AUTO_START'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" start MessageInProtector'
!macroend

!macro customUnInstall
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" stop MessageInProtector'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" remove MessageInProtector confirm'
!macroend