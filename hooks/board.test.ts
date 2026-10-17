import { expect, test } from 'claude-code/testing'

import { colorFor, toy } from './art'
import { agentName, applyCall, applyPlan, iconFor, replaceSource } from './register'

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
  expect(agentName(undefined, 'Revisar el diff completo', 'Explore')).toBe('Revisar el diff co')
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
