' LongSang Admin - Silent Launcher
' Starts n8n (no auth, auto-login) + Electron App + Auto open workflows

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

projectDir = "D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin"
objShell.CurrentDirectory = projectDir

' Set environment variables for NO AUTHENTICATION
objShell.Environment("PROCESS")("N8N_USER_MANAGEMENT_DISABLED") = "true"
objShell.Environment("PROCESS")("N8N_BASIC_AUTH_ACTIVE") = "false"
objShell.Environment("PROCESS")("N8N_SKIP_OWNER_SETUP") = "true"
objShell.Environment("PROCESS")("N8N_SECURE_COOKIE") = "false"

' Check if n8n is already running
On Error Resume Next
Set objHTTP = CreateObject("MSXML2.XMLHTTP")
objHTTP.Open "GET", "http://localhost:5678/healthz", False
objHTTP.Send
n8nRunning = (objHTTP.Status = 200)
On Error GoTo 0

If Not n8nRunning Then
    ' Start n8n in background with NO AUTH
    objShell.Run "cmd /c set N8N_USER_MANAGEMENT_DISABLED=true && set N8N_BASIC_AUTH_ACTIVE=false && set N8N_SKIP_OWNER_SETUP=true && n8n start", 0, False
    WScript.Sleep 5000 ' Wait 5 seconds for n8n to start
End If

' Start Electron app
objShell.Run "cmd /c npm run desktop:dev", 0, False
