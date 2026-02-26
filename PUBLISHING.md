# Checklist: Publishing the plugin to Obsidian Community Plugins

Based on [Obsidian’s documentation](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) and [submission requirements](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins).

---

## Prerequisites (repo contents)

- [ ] **`manifest.json`** – Present and correct (id, name, author, description, version, minAppVersion).
- [ ] **`LICENSE`** – Add a LICENSE file at the repo root (e.g. MIT, as in `package.json`).
- [ ] **`README.md`** – Describes the plugin and how to use it (already done).

## Submission requirements (quality / policy)

- [ ] **Description** – Short and simple in `manifest.json` (and in the community list entry).
- [ ] **minAppVersion** – Set to a sensible minimum Obsidian version (e.g. `0.15.0` or newer if you rely on newer APIs).
- [ ] **Command IDs** – Do not include the plugin id in command IDs (yours are fine: `task-list-open`, `task-add`, `task-add-from-selection`).
- [ ] **fundingUrl** – Only use in manifest for financial support links, if you add it.
- [ ] **Node/Electron** – Use only on desktop if you use Node/Electron APIs; otherwise you’re fine with `isDesktopOnly: false`.
- [ ] **Sample code** – Remove any leftover sample/template code (your project looks clean).

## Step 1: Publish the plugin on GitHub

- [ ] Create a **public** GitHub repository (if not already).
- [ ] Push your code (excluding `node_modules/`; `main.js` can be gitignored and built at release time).
- [ ] Ensure the default branch name is correct (often `main`; document it for Step 3).

## Step 2: Create a release

- [ ] Bump **`version`** in `manifest.json` following [Semantic Versioning](https://semver.org/) (e.g. `1.0.0` for first release).
- [ ] Build the plugin: `npm run build`.
- [ ] [Create a GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#creating-a-release):
  - **Tag**: same as version in manifest **without** a leading `v` (e.g. `1.0.0`).
  - **Upload as release assets**:
    - `manifest.json`
    - `main.js`
    - `styles.css` (optional; include if the plugin has styles).

Optional: automate with [GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions) (build + create release + attach files).

## Step 3: Submit for review

- [ ] Fork [obsidian-releases](https://github.com/obsidianmd/obsidian-releases).
- [ ] In `community-plugins.json`, add an entry, e.g.:
  ```json
  {
    "id": "obsidian-taskify",
    "name": "Obsidian Taskify",
    "author": "Nicolas Orefice",
    "description": "Task list with states, priority, tags, and due date. Create tasks from your notes.",
    "repo": "norefice/Obsidian-Taskify",
    "branch": "main"
  }
  ```
  Use your real GitHub username and repo name; set `branch` to your default branch.
- [ ] Create a **Pull Request** from your fork to `obsidianmd/obsidian-releases`, using the PR template if there is one.
- [ ] Fill in the PR description and checkboxes as requested.

## Step 4: After submission

- [ ] **Address review comments** from the Obsidian team (or community reviewers) on the PR.
- [ ] Once the PR is merged, the plugin will be available in Obsidian’s Community plugins list.
- [ ] For future updates: bump version, create a new release with the same assets; Obsidian will pick up new versions from your releases.

---

## Quick reference links

- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Submission requirements for plugins](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Release with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)
- [obsidian-releases (community-plugins.json)](https://github.com/obsidianmd/obsidian-releases)
- [Unofficial guide (submit + release)](https://marcusolsson.github.io/obsidian-plugin-docs/publishing/submit-your-plugin)
