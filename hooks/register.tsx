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
    return { id, title: it.title, status: it.status, agents: it.status === 'pending' ? kept : addAgent(kept, loop), loop }
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
    return id ? [...all, { id: `task:${id}`, title: String(input.subject ?? ''), status: 'pending', agents: [], loop }] : all
  }
  return all
}

const base = (p: unknown) => String(p ?? '').split(/[\\/]/).pop() || ''
const cut = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

/** One tool call in plain words, for the line under an agent: "Editando register.tsx". */
export const describe = (tool: string, input: Record<string, unknown>): string => {
  const str = (k: string) => (typeof input[k] === 'string' ? (input[k] as string) : '')
  switch (tool) {
    case 'Read': return `Leyendo ${base(input.file_path)}`
    case 'Edit': case 'MultiEdit': case 'Write': case 'NotebookEdit': return `Editando ${base(input.file_path ?? input.notebook_path)}`
    case 'Bash': case 'PowerShell': return cut(str('description') || `Ejecutando ${str('command')}`)
    case 'Grep': return cut(`Buscando "${str('pattern')}"`)
    case 'Glob': return cut(`Buscando archivos ${str('pattern')}`)
    case 'WebFetch': return cut(`Leyendo ${str('url').replace(/^https?:\/\//, '').split('/')[0]}`)
    case 'WebSearch': return cut(`Buscando en la web: ${str('query')}`)
    case 'Agent': return cut(`Delegando: ${str('description')}`)
    case 'Skill': return `Usando la skill ${str('skill')}`
  }
  if (TRACKED.has(tool)) return 'Actualizando su plan'
  if (tool.startsWith('mcp__')) return cut(`Usando ${tool.split('__').pop()}`)
  return tool
}

/** Claude's own row lives in the same list under id `main`, made on its first call. */
export const setActivity = (list: AgentSeen[], id: string, activity: string | undefined): AgentSeen[] =>
  list.some(a => a.id === id)
    ? list.map(a => (a.id === id ? { ...a, activity } : a))
    : id === MAIN
      ? [...list, { id: MAIN, type: MAIN, name: 'Claude', isDone: false, activity }]
      : list

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
    const loop = e.agentId ?? MAIN
    const input = e as unknown as Record<string, unknown>
    const activity = describe(tool, input)
    await safe(update($, agents, list => setActivity(list, loop, activity)))
    if (!TRACKED.has(tool)) return next(e)
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
    if (id) await safe(update($, agents, list => list.map(a => (a.id === id ? { ...a, isDone: true, activity: undefined } : a))))
    else await safe(update($, agents, list => setActivity(list, MAIN, undefined)))
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const all = await read($, tasks)
    const seen = await read($, agents)
    const byId = new Map<string, AgentSeen>(seen.map(a => [a.id, a]))
    // Your plan is what the main loop wrote; a subagent's own steps nest under that agent.
    const list = all.filter(t => (t.loop ?? MAIN) === MAIN)
    const stepsOf = (id: string) => all.filter(t => t.loop === id)
    const count = (s: TaskStatus) => list.filter(t => t.status === s).length
    const mainBusy = list.some(t => t.status === 'in_progress' && t.agents.includes(MAIN))
    const claude: AgentSeen = { id: MAIN, type: MAIN, name: 'Claude', isDone: false, ...byId.get(MAIN) }
    const subagents = seen.filter(a => a.id !== MAIN)
    // Team: Claude first, then running agents, then the last few that finished.
    const team: AgentSeen[] = [claude, ...subagents.filter(a => !a.isDone), ...subagents.filter(a => a.isDone).slice(-4)]
    // Under a task in progress: every subagent that worked on it, or Claude when it works alone.
    const crewOf = (t: Task): AgentSeen[] => {
      const subs = t.agents.filter(id => id !== MAIN).map(id => byId.get(id)).filter((a): a is AgentSeen => !!a)
      return subs.length > 0 ? subs : t.agents.includes(MAIN) ? [claude] : []
    }
    const placed = new Set(list.filter(t => t.status === 'in_progress').flatMap(t => t.agents))
    const loose = subagents.filter(a => !a.isDone && !placed.has(a.id))
    const lineOf = (a: AgentSeen) => (a.isDone ? 'Terminado' : (a.activity ?? (a.id === MAIN ? 'Pensando' : 'Arrancando')))

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const agentLines = (a: AgentSeen) => (
        <Box flexDirection="column" paddingLeft={3}>
          <Text dimColor={a.isDone}>
            {a.isDone ? '✓' : '↳'} {iconFor(a.type)} {a.name}
            <Text dimColor> — {lineOf(a)}</Text>
          </Text>
          {stepsOf(a.id).map(st => (
            <Text dimColor>
              {'    '}
              {MARK[st.status]} {st.title}
            </Text>
          ))}
        </Box>
      )
      return (
        <Box flexDirection="column">
          <Text bold>
            ✅ {count('completed')}  🔄 {count('in_progress')}  ⏳ {count('pending')}
          </Text>
          {list.length === 0 && <Text dimColor>Sin tareas todavía.</Text>}
          {list.map(t => (
            <Box flexDirection="column">
              <Text dimColor={t.status === 'completed'} bold={t.status === 'in_progress'}>
                {MARK[t.status]} {t.title}
              </Text>
              {t.status === 'in_progress' && crewOf(t).map(agentLines)}
            </Box>
          ))}
          {loose.length > 0 && <Text dimColor>Sin tarea asignada</Text>}
          {loose.map(agentLines)}
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    const done = count('completed')
    const total = list.length
    const toyOf = (a: AgentSeen, mood: ToyMood) => toy(a.id === MAIN ? MAIN_COLOR : colorFor(a.id), mood)
    const moodOf = (a: AgentSeen): ToyMood => (a.isDone ? 'done' : a.id === MAIN && !mainBusy ? 'idle' : 'working')
    const LABEL: Record<TaskStatus, string> = { completed: 'Completada', in_progress: 'En curso', pending: 'Pendiente' }

    // One agent under a task: its critter, name and live activity, then its own steps.
    const agentRow = (a: AgentSeen, scope: string) => (
      <Box key={`${scope}-${a.id}`} flexDirection="column" paddingLeft={3}>
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Svg source={toyOf(a, moodOf(a))} alt={a.name} width={22} height={19} isInteractive={!a.isDone} />
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            <Text size="footnote" weight="medium" dimColor={a.isDone} wrap="truncate-end">
              {a.name}
            </Text>
            <Text size="caption" dimColor wrap="truncate-end">
              {lineOf(a)}
            </Text>
          </Box>
        </Box>
        {stepsOf(a.id).map(st => (
          <Box key={`${scope}-${a.id}-${st.id}`} flexDirection="row" alignItems="center" gap={1} paddingLeft={4}>
            <Svg source={statusGlyph[st.status]} alt={LABEL[st.status]} width={12} height={12} isInteractive={st.status === 'in_progress'} />
            <Text size="caption" dimColor={st.status !== 'in_progress'} wrap="truncate-end">
              {st.title}
            </Text>
          </Box>
        ))}
      </Box>
    )

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
          {list.map(t => (
            <Box key={`task-${t.id}`} flexDirection="column">
              <Box flexDirection="row" alignItems="center" gap={1}>
                <Svg source={statusGlyph[t.status]} alt={LABEL[t.status]} width={16} height={16} isInteractive={t.status === 'in_progress'} />
                <Box flexGrow={1} flexShrink={1}>
                  <Text dimColor={t.status === 'completed'} wrap="truncate-end">
                    {t.title}
                  </Text>
                </Box>
              </Box>
              {t.status === 'in_progress' && crewOf(t).map(a => agentRow(a, t.id))}
            </Box>
          ))}
          {loose.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text size="footnote" dimColor>
                Sin tarea asignada
              </Text>
              {loose.map(a => agentRow(a, 'loose'))}
            </Box>
          )}
        </Box>
      </Box>
    )
  })
}

/** What the toy is called: the agent's own name, else its short task, else its type. */
export const agentName = (name: string | undefined, description: string | undefined, type: string): string =>
  cut((name || description || type).trim(), 40)
