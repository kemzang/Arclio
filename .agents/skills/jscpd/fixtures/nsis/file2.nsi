!include LogicMacros.nsh

Name "MyApplication Installer"
OutFile "MyApp-Setup.exe"
InstallDir "$PROGRAMFILES64\MyApp"
InstallDirRegKey HKLM "Software\MyApp" "InstallDir"
RequestExecutionLevel admin

Section "Core Application" SEC_CORE
    SetOutPath "$INSTDIR"
    File /r "dist\*.*"
    WriteRegStr HKLM "Software\MyApp" "InstallDir" "$INSTDIR"
    WriteRegStr HKLM "Software\MyApp" "Version" "1.0.0"
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    CreateDirectory "$SMPROGRAMS\MyApp"
    CreateShortcut "$SMPROGRAMS\MyApp\MyApp.lnk" "$INSTDIR\myapp.exe"
    CreateShortcut "$DESKTOP\MyApp.lnk" "$INSTDIR\myapp.exe"
SectionEnd

Section "un.Core Application"
    Delete "$INSTDIR\*.*"
    RMDir /r "$INSTDIR"
    DeleteRegKey HKLM "Software\MyApp"
    Delete "$SMPROGRAMS\MyApp\MyApp.lnk"
    Delete "$DESKTOP\MyApp.lnk"
    RMDir "$SMPROGRAMS\MyApp"
SectionEnd

; File-specific: install plugins
Section "Plugins" SEC_PLUGINS
    SetOutPath "$INSTDIR\plugins"
    File /r "plugins\*.*"
    WriteRegStr HKLM "Software\MyApp" "PluginsDir" "$INSTDIR\plugins"
SectionEnd
