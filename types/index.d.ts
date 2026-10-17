export type TaskStatus = 'pending' | 'in_progress' | 'completed'
/** One task; `agents` lists the loops working on it ('main' or a subagent id). */
export type Task = { id: string; title: string; status: TaskStatus; agents: string[] }
/** One agent seen this session. */
export type AgentSeen = { id: string; type: string; name: string; isDone: boolean }

declare module 'claude-code' {
  interface PluginState {
    'task-board': { tasks: Task[]; agents: AgentSeen[] }
  }
}
