# Move File To Folder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file Tkinter desktop app that searches pasted file names recursively in a source folder and copies matches to a destination folder.

**Architecture:** Keep the UI and file-copy worker in `MoveFileToFolder.py` because the target project currently has one empty file. Use small pure helper functions for parsing names, indexing files, and resolving non-overwrite destination names, then a Tkinter class for the light-theme interface and thread-safe progress updates.

**Tech Stack:** Python standard library only: `tkinter`, `pathlib`, `shutil`, `threading`, `queue`, and `collections`.

---

### Task 1: Helper Functions

**Files:**
- Modify: `C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py`

- [ ] **Step 1: Add helper functions**

Create `parse_requested_names(text)`, `build_file_index(source_dir)`, and `unique_destination_path(destination_dir, filename)`.

- [ ] **Step 2: Verify helper behavior manually**

Run: `py -3 -m py_compile "C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py"`
Expected: no output and exit code 0.

### Task 2: Tkinter UI

**Files:**
- Modify: `C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py`

- [ ] **Step 1: Add the app class**

Create a `MoveFileToFolderApp` class with source/destination selectors, multiline file-name input, progress bar, status text, log panel, and Start/Clear controls.

- [ ] **Step 2: Add validation**

Validate that source folder exists, destination folder exists, and at least one file name was entered before starting a copy job.

### Task 3: Background Copy Worker

**Files:**
- Modify: `C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py`

- [ ] **Step 1: Add worker thread**

Scan files and copy in a background thread, sending log/progress events through a queue.

- [ ] **Step 2: Add UI queue polling**

Use `after()` to poll the queue and update progress/status without touching Tkinter widgets from the worker thread.

### Task 4: Verification

**Files:**
- Modify: `C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py`

- [ ] **Step 1: Compile**

Run: `py -3 -m py_compile "C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py"`
Expected: no output and exit code 0.

- [ ] **Step 2: Helper smoke test**

Run a small import-based script that creates temporary source/destination folders, indexes nested files, copies through helper functions, and confirms duplicate destination naming.
Expected: copied files exist and unique names avoid overwrite.

## Self-Review

- Spec coverage: UI selectors, pasted multiline input, recursive search, duplicate-source warning, non-overwrite destination naming, progress/status, log, validation, and background worker are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: helper names are consistent across tasks.
