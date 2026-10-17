# task-board

A Claude Code mod that opens a live **Tareas** pane beside the conversation:

- **Progress**: done / total with a bar.
- **Equipo** (team): one boxy critter per agent, in the spirit of Claude's mascot. Claude itself is terracotta; every subagent gets its own color and its name. Critters walk and blink while they work and close their eyes when they finish.
- **Task list** in the app's own todo style: grey check for done, spinner for in progress, dashed ring for pending. Under a task in progress, the critters and names of the agents working on it.

It follows `TaskCreate` / `TaskUpdate`, `TodoWrite` and the desktop app's plan, including calls made inside subagents. When a session is resumed it rebuilds the board from the transcript and the session's agent list.

The pane opens by itself where the window is wide enough; `/tablero` opens it at any width. In a terminal it draws a text version.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install task-board --marketplace angelitolm/task-board
```

Answer `y` to add the marketplace, then pick the **user** scope so it loads in every session.

From a shell:

```bash
claude plugin install task-board --marketplace angelitolm/task-board
```

In the Claude desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `angelitolm/task-board`, then **Add plugin**.

## Develop

```bash
claude plugin validate .
claude plugin test .
```

## Credits

Icons from [Iconsax](https://iconsax-react.pages.dev/) (`iconsax-react`, MIT License, © Erfan Khadivar).
