// eslint-disable-next-line
const { createMacro } = require('babel-plugin-macros')

// transforms
// const a = <div show-if={a}>test</div>
//
//    ↓     ↓     ↓     ↓     ↓     ↓
//
// const a = <Show when={a}><div>test</div></Show>;
//
// TODO: assure that Show is imported ...

module.exports = createMacro(myMacro)

const cloneAndRemoveAttr = (path, t) => {
  const parentPath = path.parentPath.parentPath
  const expression = t.cloneDeep(path.node.value)
  path.remove()
  const node = t.cloneDeep(parentPath.node)
  return { parentPath, expression, node }
}

function myMacro({ state, babel }) {
  babel.traverse(state.file.ast, {
    JSXAttribute(path) {
      if (path.node.name.name === 'show-if') {
        const t = babel.types
        const { parentPath, expression, node } = cloneAndRemoveAttr(path, t)
        const newElement = t.JSXElement(
          t.JSXOpeningElement(t.JSXIdentifier('Show'), [
            t.JSXAttribute(t.JSXIdentifier('when'), expression)
          ]),
          t.JSXClosingElement(t.JSXIdentifier('Show')),
          [node]
        )
        parentPath.replaceWith(newElement)
      }
    }
  })
}
