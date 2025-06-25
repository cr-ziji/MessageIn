!macro customInstall
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" install MessageInProtector "$INSTDIR\\psexec.exe" -accepteula -i 1 "$INSTDIR\\MessageIn-Display.exe"'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" set MessageInProtector DisplayName "MessageInProtector"'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" set MessageInProtector Start SERVICE_AUTO_START'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" start MessageInProtector"'
!macroend

!macro customUnInstall
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" stop MessageInProtector'
  nsExec::ExecToLog '"$INSTDIR\\nssm.exe" remove MessageInProtector confirm'
!macroend