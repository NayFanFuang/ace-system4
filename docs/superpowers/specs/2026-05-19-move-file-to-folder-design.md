# Move File To Folder Design

## Goal

Create a Windows-friendly Python desktop utility at `C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py`.
The app lets the user paste multiple file names, searches for those files inside a selected source folder and all nested subfolders, then copies found files into a selected destination folder.

## User Interface

Use a single-file Tkinter app with a light theme.

The main window includes:

- Source folder selector with a text field and Browse button.
- Destination folder selector with a text field and Browse button.
- Large multiline text area for pasted file names, one file name per line.
- Start Copy button.
- Clear button.
- Determinate progress bar based on the number of requested file names.
- Status label showing copied, missing, duplicate-name warnings, and errors.
- Read-only log panel showing the result for each requested file.

## Behavior

- Parse pasted input by line.
- Trim whitespace and ignore blank lines.
- Preserve the user's requested order when processing.
- Search recursively under the source folder.
- Match by exact file name, case-insensitive on Windows.
- If a requested file is found once, copy it to the destination folder.
- If a requested file is found in multiple source locations, copy the first discovered path and log a duplicate warning listing the count.
- If the destination already has a same-named file, avoid overwrite by writing `name (1).ext`, `name (2).ext`, and so on.
- If a requested file is missing, log it as missing.
- If copying fails, log the exception and continue with the remaining files.

## Responsiveness

Run scanning and copying in a background thread so the UI remains responsive.
Send progress and log updates back to the Tkinter main thread through a queue polled with `after()`.
Disable Start Copy while a job is running and re-enable it when done.

## Validation

Before starting:

- Source folder must exist.
- Destination folder must exist.
- At least one non-empty file name must be provided.

Show validation errors with message boxes and do not start a job until the inputs are valid.

## Testing And Verification

Because this is a GUI utility, verification will focus on:

- Python syntax compilation with `py -3 -m py_compile`.
- A small temporary folder manual logic check if feasible.
- Confirming the app can be launched far enough for Tkinter import and class setup.

## Scope

No external dependencies.
No file moving or deletion.
No overwrite mode.
No packaging into `.exe` in this iteration.
