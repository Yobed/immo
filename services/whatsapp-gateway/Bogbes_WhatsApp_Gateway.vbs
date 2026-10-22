' Bogbes Group - Passerelle WhatsApp Autonome (Démarrage Silencieux Windows)
Option Explicit

Dim fso, sh, nodePath, scriptPath, workDir, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

nodePath = "C:\Users\WILFRIED\bin\nodejs\node-v24.13.0-win-x64\node.exe"
scriptPath = "C:\Users\WILFRIED\OneDrive - Gravel Ivoire\Bureau\immo\services\whatsapp-gateway\run-gateway.js"
workDir = "C:\Users\WILFRIED\OneDrive - Gravel Ivoire\Bureau\immo\scratch\hf-n8n-test\wa-gateway"

If Not fso.FileExists(nodePath) Then
    nodePath = "node.exe"
End If

If fso.FolderExists(workDir) Then
    sh.CurrentDirectory = workDir
End If

If fso.FileExists(scriptPath) Then
    cmd = """" & nodePath & """ """ & scriptPath & """"
    ' 0 = fenêtre masquée, False = exécution en arrière-plan sans bloquer
    sh.Run cmd, 0, False
End If
