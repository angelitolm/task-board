import { expect, test } from 'claude-code/testing'

test('pane draws tasks and toys on every surface', async ($, on) => {
  on('tool.call', async () => ({ result: { oldTodos: [], newTodos: [] } }) as never)
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'Escribir tests', status: 'completed', activeForm: 'Escribiendo tests' },
      { content: 'Diseñar panel', status: 'in_progress', activeForm: 'Diseñando panel' },
      { content: 'Publicar', status: 'pending', activeForm: 'Publicando' },
    ],
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'task-board', surface, component: 'Pane', requestId: 'task-board', props: { bodyColumns: 50 } as never, viewport: { columns: 50, rows: 40 } })
    expect(await ui.find({ type: 'Text', text: /Publicar/ })).toBeDefined()
    if (surface === 'desktop') expect(await ui.find({ key: 'toy-main' })).toBeDefined()
    await ui.unmount()
  }
})
