!macro customInstall
  nsExec::ExecToLog '"$INSTDIR\\node.exe" "$INSTDIR\\process-protection.js"'
!macroend

!macro customUnInstall
  nsExec::ExecToLog '"$INSTDIR\\node.exe" -e "require(\'node-windows\').Service({name:\'MessageInProtector\',script:\'$INSTDIR\\process-protection.js\'}).uninstall()"'
!macroend