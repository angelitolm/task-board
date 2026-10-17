export type TaskStatus = 'pending' | 'in_progress' | 'completed'
/** One task; `agents` lists the loops working on it ('main' or a subagent id), `loop` the one that wrote it. */
export type Task = { id: string; title: string; status: TaskStatus; agents: string[]; loop?: string }
/** One agent seen this session. */
/** `activity`: what its latest tool call is doing, in words. */
export type AgentSeen = { id: string; type: string; name: string; isDone: boolean; activity?: string }

declare module 'claude-code' {
  interface PluginState {
    'task-board': { tasks: Task[]; agents: AgentSeen[] }
  }
}
