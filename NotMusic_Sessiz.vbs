Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\juste\OneDrive\Desktop\notmusic"
WshShell.Run "node_modules\electron\dist\electron.exe .", 0, False
