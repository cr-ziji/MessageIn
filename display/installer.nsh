!macro customInstall
  nsExec::ExecToLog 'sc create "MessageInProtector" binPath= "$INSTDIR\\MessageIn-Display.exe" start= auto DisplayName= "MessageInProtector"'
  nsExec::ExecToLog 'sc start "MessageInProtector"'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'sc stop "MessageInProtector"'
  nsExec::ExecToLog 'sc delete "MessageInProtector"'
!macroend