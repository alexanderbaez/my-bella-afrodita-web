@echo off
setlocal
set "DIR=%~dp0"
"%DIR%backend\mvnw.cmd" -f "%DIR%backend\pom.xml" %*
