import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentSeen, Task, TaskStatus } from '../types'
import { bar, colorFor, icon, MAIN_COLOR, statusGlyph, toy } from './art'
import type { ToyMood } from './art'

const PANE = 'task-board'
const PLAN_TOOL = 'mcp__ccd_turn__update_plan'
const tasks = atom({ plugin: 'task-board', key: 'tasks' } as const, [])
const agents = atom({ plugin: 'task-board', key: 'agents' } as const, [])

const MAIN = 'main'
// Bookkeeping never blocks a tool call or a spawn: a failed write only leaves the board stale.
const safe = (p: Promise<unknown>) => p.catch(() => undefined)
const MARK: Record<TaskStatus, string> = { completed: '✅', in_progress: '🔄', pending: '⏳' }

// ponytail: icon by keyword in the agent type; extend the table for new agent types
const ICONS: [RegExp, string][] = [
  [/explore|investigat|locator/i, '🔍'],
  [/plan|architect/i, '🧭'],
  [/review|audit/i, '🧐'],
  [/test|tdd|e2e/i, '🧪'],
  [/build|fix|resolver/i, '🔧'],
  [/doc|writer/i, '📝'],
  [/secur/i, '🛡️'],
]
export const iconFor = (type: string): string =>
  type === MAIN ? '🧠' : (ICONS.find(([re]) => re.test(type))?.[1] ?? '🤖')

const addAgent = (list: string[], loop: string) => (list.includes(loop) ? list : [...list, loop])

/** Replaces one source's tasks (ids starting with `prefix`), keeping the rest. */
export const replaceSource = (
  all: Task[],
  prefix: string,
  items: { title: string; status: TaskStatus }[],
  loop: string,
): Task[] => {
  const old = new Map(all.filter(t => t.id.startsWith(prefix)).map(t => [t.id, t]))
  const fresh = items.map((it, i): Task => {
    const id = prefix + i
    const kept = old.get(id)?.agents ?? []
    return { id, title: it.title, status: it.status, agents: it.status === 'pending' ? kept : addAgent(kept, loop) }
  })
  return [...all.filter(t => !t.id.startsWith(prefix)), ...fresh]
}

/** Applies an `update_plan` call (items | advance | done/start) to the plan tasks. */
export const applyPlan = (all: Task[], input: Record<string, unknown>, loop: string): Task[] => {
  const prefix = `plan:${loop}:`
  if (Array.isArray(input.items)) {
    const items = (input.items as { content?: string; status?: TaskStatus }[]).map(it => ({
      title: String(it.content ?? ''),
      status: it.status ?? 'pending',
    }))
    return replaceSource(all, prefix, items, loop)
  }
  const plan = all.filter(t => t.id.startsWith(prefix))
  const items = plan.map(t => ({ title: t.title, status: t.status }))
  const set = (n: number, status: TaskStatus) => {
    if (items[n]) items[n] = { ...items[n], status }
  }
  if (input.advance === true) {
    const cur = items.findIndex(t => t.status === 'in_progress')
    if (cur >= 0) set(cur, 'completed')
    const nxt = items.findIndex(t => t.status === 'pending')
    if (nxt >= 0) set(nxt, 'in_progress')
  }
  for (const n of Array.isArray(input.done) ? (input.done as number[]) : []) set(n - 1, 'completed')
  if (typeof input.start === 'number') set(input.start - 1, 'in_progress')
  return replaceSource(all, prefix, items, loop)
}

const setTask = (all: Task[], id: string, patch: Partial<Task>, loop: string): Task[] =>
  all.map(t =>
    t.id !== id
      ? t
      : { ...t, ...patch, agents: patch.status === 'in_progress' ? addAgent(t.agents, loop) : t.agents },
  )

const TRACKED = new Set(['TodoWrite', 'TaskCreate', 'TaskUpdate', PLAN_TOOL])

/** One task-tool call applied to the board; `result` only matters for TaskCreate (its id). */
export const applyCall = (all: Task[], tool: string, input: Record<string, unknown>, loop: string, result?: unknown): Task[] => {
  if (tool === 'TodoWrite') {
    const todos = (Array.isArray(input.todos) ? input.todos : []) as { content: string; status: TaskStatus; activeForm?: string }[]
    const items = todos.map(t => ({ title: t.status === 'in_progress' ? t.activeForm || t.content : t.content, status: t.status }))
    return replaceSource(all, `todo:${loop}:`, items, loop)
  }
  if (tool === PLAN_TOOL) return applyPlan(all, input, loop)
  if (tool === 'TaskUpdate') {
    const id = `task:${String(input.taskId)}`
    if (input.status === 'deleted') return all.filter(t => t.id !== id)
    const patch: Partial<Task> = {}
    if (typeof input.status === 'string') patch.status = input.status as TaskStatus
    if (typeof input.subject === 'string') patch.title = input.subject
    return setTask(all, id, patch, typeof input.owner === 'string' ? input.owner : loop)
  }
  if (tool === 'TaskCreate') {
    const id = (result as { task?: { id?: string } } | undefined)?.task?.id
    return id ? [...all, { id: `task:${id}`, title: String(input.subject ?? ''), status: 'pending', agents: [] }] : all
  }
  return all
}

const DONE_STATUSES = new Set(['completed', 'failed', 'killed', 'idle'])

/**
 * A resumed or restarted session: replay the main transcript's task calls and take the
 * agents from the engine's own list, so the board shows what happened before it loaded.
 */
const rebuild = async ($: EngineInterface) => {
  const held = await read($, tasks)
  if (held.length === 0) {
    const rows = await $.session.messages()
    let board: Task[] = []
    for (const row of rows) for (const use of row.toolUses) if (TRACKED.has(use.tool)) board = applyCall(board, use.tool, use.input, MAIN, use.result)
    if (board.length > 0) await update($, tasks, () => board)
  }
  const list = await $.agent.list()
  const fresh: AgentSeen[] = list.map(a => ({
    id: a.id,
    type: a.type,
    name: agentName(a.name, a.description, a.type),
    isDone: DONE_STATUSES.has(a.status),
  }))
  await update($, agents, old => [...old.filter(o => !fresh.some(f => f.id === o.id)), ...fresh].slice(-100))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Open first: a refused command must never keep the pane closed.
    void $.ui.open({ id: PANE, title: 'Tareas' })
    await safe($.command.register({ name: 'tablero', description: 'Abre el panel de tareas en vivo' }))
    // Off the start path: reading history must never slow the session down.
    void safe(rebuild($))
    return next(e)
  })

  on('command.run', { command: 'tablero' }, async $ => {
    const opened = await $.ui.open({ id: PANE, title: 'Tareas' })
    return { text: opened.isPlaced ? 'Panel de tareas abierto.' : `Panel no colocado: ${opened.reason}` }
  })

  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    if (!TRACKED.has(tool)) return next(e)
    const loop = e.agentId ?? MAIN
    const input = e as unknown as Record<string, unknown>
    // TaskCreate learns its id from the result; the others act on what they were asked.
    if (tool === 'TaskCreate') {
      const ran = await next(e)
      await safe(update($, tasks, all => applyCall(all, tool, input, loop, ran.result)))
      return ran
    }
    await safe(update($, tasks, all => applyCall(all, tool, input, loop)))
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const ran = await next(e)
    const id = 'agentId' in ran ? ran.agentId : undefined
    if (!id) return ran
    const parent = e.parentAgentId ?? MAIN
    const seen: AgentSeen = { id, type: e.subagentType, name: agentName(e.name, e.description, e.subagentType), isDone: false }
    await safe(update($, agents, list => [...list.filter(a => a.id !== id), seen].slice(-100)))
    // The spawned agent works on whatever its parent has in progress right now.
    await safe(update($, tasks, all =>
      all.map(t => (t.status === 'in_progress' && t.agents.includes(parent) ? { ...t, agents: addAgent(t.agents, id) } : t)),
    ))
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id) await safe(update($, agents, list => list.map(a => (a.id === id ? { ...a, isDone: true } : a))))
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const list = await read($, tasks)
    const seen = await read($, agents)
    const byId = new Map<string, AgentSeen>(seen.map(a => [a.id, a]))
    const count = (s: TaskStatus) => list.filter(t => t.status === s).length
    const mainBusy = list.some(t => t.status === 'in_progress' && t.agents.includes(MAIN))
    const live = (id: string) => (id === MAIN ? mainBusy : byId.get(id)?.isDone === false)
    // Team: Claude first, then running agents, then the last few that finished.
    const team: AgentSeen[] = [
      { id: MAIN, type: MAIN, name: 'Claude', isDone: false },
      ...seen.filter(a => !a.isDone),
      ...seen.filter(a => a.isDone).slice(-4),
    ]
    const who = (t: Task) => (t.status === 'in_progress' ? t.agents.filter(live) : t.status === 'completed' ? t.agents : [])

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const typeOf = (id: string) => (id === MAIN ? MAIN : (byId.get(id)?.type ?? 'agent'))
      return (
        <Box flexDirection="column">
          <Text bold>
            ✅ {count('completed')}  🔄 {count('in_progress')}  ⏳ {count('pending')}
          </Text>
          {list.length === 0 && <Text dimColor>Sin tareas todavía.</Text>}
          {list.map(t => (
            <Text dimColor={t.status === 'completed'} bold={t.status === 'in_progress'}>
              {MARK[t.status]} {t.title}
              {who(t).length > 0 ? '  ' + who(t).map(id => iconFor(typeOf(id))).join('') : ''}
            </Text>
          ))}
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    const done = count('completed')
    const total = list.length
    const toyOf = (a: AgentSeen, mood: ToyMood) => toy(a.id === MAIN ? MAIN_COLOR : colorFor(a.id), mood)
    const moodOf = (a: AgentSeen): ToyMood => (a.isDone ? 'done' : a.id === MAIN && !mainBusy ? 'idle' : 'working')
    const STATUS: Record<TaskStatus, { label: string }> = {
      completed: { label: 'Completada' },
      in_progress: { label: 'En curso' },
      pending: { label: 'Pendiente' },
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column" gap={0}>
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Svg source={icon('task', '#C9A4FF')} alt="" width={18} height={18} />
            <Text weight="semibold">Progreso</Text>
            <Text dimColor tabular>
              {done}/{total}
            </Text>
          </Box>
          <Svg source={bar(done, total)} alt={`${done} de ${total} completadas`} height={6} />
        </Box>

        <Box flexDirection="column" gap={0}>
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Svg source={icon('people', '#F4B39A')} alt="" width={18} height={18} />
            <Text weight="semibold">Equipo</Text>
          </Box>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {team.map(a => (
              <Box key={`toy-${a.id}`} flexDirection="column" alignItems="center" width={10}>
                <Svg source={toyOf(a, moodOf(a))} alt={`${a.name}: ${moodOf(a)}`} width={52} height={45} isInteractive />
                <Text size="footnote" weight={a.isDone ? 'regular' : 'medium'} dimColor={a.isDone} wrap="truncate-end">
                  {a.name}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1} gap={0}>
          {list.length === 0 && <Text dimColor>Sin tareas todavía.</Text>}
          {list.map(t => {
            const working = who(t).map(id => (id === MAIN ? team[0] : byId.get(id))).filter((a): a is AgentSeen => !!a)
            return (
              <Box key={`task-${t.id}`} flexDirection="column">
                <Box flexDirection="row" alignItems="center" gap={1}>
                  <Svg source={statusGlyph[t.status]} alt={STATUS[t.status].label} width={16} height={16} isInteractive={t.status === 'in_progress'} />
                  <Box flexGrow={1} flexShrink={1}>
                    <Text dimColor={t.status === 'completed'} wrap="truncate-end">
                      {t.title}
                    </Text>
                  </Box>
                </Box>
                {t.status === 'in_progress' && working.length > 0 && (
                  <Box flexDirection="row" alignItems="center" gap={1} paddingLeft={3}>
                    {working.map(a => (
                      <Svg source={toyOf(a, 'working')} alt={a.name} width={18} height={16} isInteractive />
                    ))}
                    <Text size="footnote" dimColor wrap="truncate-end">
                      {working.map(a => a.name).join(', ')}
                    </Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}

/** What the toy is called: the agent's own name, else its short task, else its type. */
export const agentName = (name: string | undefined, description: string | undefined, type: string): string =>
  (name || description || type).trim().slice(0, 18)
