import { expect, test } from 'claude-code/testing'

import { colorFor, toy } from './art'
import { agentName, applyCall, applyPlan, describe, iconFor, replaceSource, setActivity } from './register'

test('plan: items, advance, done/start', () => {
  let all = applyPlan([], { items: [{ content: 'a', status: 'in_progress' }, { content: 'b', status: 'pending' }, { content: 'c', status: 'pending' }] }, 'main')
  expect(all.map(t => t.status)).toEqual(['in_progress', 'pending', 'pending'])
  expect(all[0]?.agents).toEqual(['main'])

  all = applyPlan(all, { advance: true }, 'main')
  expect(all.map(t => t.status)).toEqual(['completed', 'in_progress', 'pending'])

  all = applyPlan(all, { done: [2], start: 3 }, 'main')
  expect(all.map(t => t.status)).toEqual(['completed', 'completed', 'in_progress'])
})

test('sources stay apart; agents kept across rewrites', () => {
  let all = replaceSource([], 'todo:main:', [{ title: 'x', status: 'in_progress' }], 'main')
  all = applyPlan(all, { items: [{ content: 'p', status: 'pending' }] }, 'main')
  all = replaceSource(all, 'todo:main:', [{ title: 'x', status: 'in_progress' }], 'agent-1')
  expect(all.length).toBe(2)
  expect(all.find(t => t.title === 'x')?.agents).toEqual(['main', 'agent-1'])
})

test('icons by agent type', () => {
  expect(iconFor('main')).toBe('🧠')
  expect(iconFor('Explore')).toBe('🔍')
  expect(iconFor('ecc:code-reviewer')).toBe('🧐')
  expect(iconFor('general-purpose')).toBe('🤖')
})

test('toys and names', () => {
  expect(toy('#fff', 'working')).toContain('animateTransform')
  expect(toy('#fff', 'done')).not.toContain('<rect x="20" y="17"')
  expect(colorFor('a1')).toBe(colorFor('a1'))
  expect(agentName(undefined, 'Revisar el diff completo', 'Explore')).toBe('Revisar el diff completo')
  expect(agentName('', '', 'Plan')).toBe('Plan')
})

test('replaying task calls rebuilds the board', () => {
  let all = applyCall([], 'TaskCreate', { subject: 'Task 1' }, 'main', { task: { id: '1', subject: 'Task 1' } })
  all = applyCall(all, 'TaskCreate', { subject: 'Task 2' }, 'main', { task: { id: '2', subject: 'Task 2' } })
  all = applyCall(all, 'TaskUpdate', { taskId: '1', status: 'completed' }, 'main')
  all = applyCall(all, 'TaskUpdate', { taskId: '2', status: 'in_progress' }, 'main')
  expect(all.map(t => [t.title, t.status])).toEqual([['Task 1', 'completed'], ['Task 2', 'in_progress']])
  expect(applyCall(all, 'TaskUpdate', { taskId: '1', status: 'deleted' }, 'main').length).toBe(1)
  expect(applyCall(all, 'Bash', {}, 'main')).toBe(all)
})

test('activity in plain words', () => {
  expect(describe('Edit', { file_path: String.raw`C:\dev\app\hooks\register.tsx` })).toBe('Editando register.tsx')
  expect(describe('Read', { file_path: '/a/b/art.ts' })).toBe('Leyendo art.ts')
  expect(describe('Bash', { command: 'pnpm test', description: 'Corre los tests' })).toBe('Corre los tests')
  expect(describe('Bash', { command: 'pnpm test' })).toBe('Ejecutando pnpm test')
  expect(describe('TodoWrite', { todos: [] })).toBe('Actualizando su plan')
  expect(describe('mcp__github__create_pr', {})).toBe('Usando create_pr')
  expect(describe('Grep', { pattern: 'x'.repeat(80) }).length).toBe(60)
})

test('activity lands on the right agent; Claude row appears on demand', () => {
  const list = [{ id: 'a1', type: 'Explore', name: 'Explore', isDone: false }]
  expect(setActivity(list, 'a1', 'Leyendo x')[0]?.activity).toBe('Leyendo x')
  expect(setActivity(list, 'zz', 'nada')).toEqual(list)
  expect(setActivity(list, 'main', 'Pensando').find(a => a.id === 'main')?.name).toBe('Claude')
})

test("a subagent's own steps are tagged with its loop", () => {
  let all = applyCall([], 'TodoWrite', { todos: [{ content: 'leer', status: 'completed' }, { content: 'editar', status: 'in_progress' }] }, 'a1')
  all = applyCall(all, 'TaskCreate', { subject: 'Plan' }, 'main', { task: { id: '9' } })
  expect(all.filter(t => t.loop === 'a1').map(t => t.title)).toEqual(['leer', 'editar'])
  expect(all.find(t => t.id === 'task:9')?.loop).toBe('main')
})
