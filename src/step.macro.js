// eslint-disable-next-line
const { createMacro } = require('babel-plugin-macros')

// Transforms
//   <Slide>
//     <p>
//     	This is {step}.
//     </p>
//   </Slide>
//
//    ↓     ↓     ↓     ↓     ↓     ↓
//
//   <Slide>{step => <>
//     <p>
//     	This is {step}.
//     </p>
//   </>}</Slide>

module.exports = createMacro(myMacro)

function myMacro({ references, state, babel }) {
  const { default: defaultImport = [] } = references

  defaultImport.forEach((referencePath) => {
    const slide = referencePath.findParent((n) => {
      return (
        n.type === 'JSXElement' && n.node.openingElement.name.name === 'Slide'
      )
    })
    // console.count(slide);
    if (!slide) {
      console.error(
        'Found a reference to step without being in a slide!',
        referencePath
      )
      return
    }

    if (slide.fixedAlready) return

    const t = babel.types
    // {(step) => <> slide.node.children </>}
    const fn = t.JSXExpressionContainer(
      t.arrowFunctionExpression(
        [t.Identifier('step')],
        t.JSXFragment(
          t.JSXOpeningFragment(),
          t.JSXClosingFragment(),
          slide.node.children
        ),
        /* async */ false
      )
    )

    slide.node.children = [fn]
    slide.fixedAlready = true
  })
}
