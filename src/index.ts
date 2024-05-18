import './tailwind.min.css'
import './index.css'
import * as modern from './themes/modern'
import * as principiae from './themes/principiae'

const themes = {
  modern,
  principiae
}

export {RenderPresentation, PresentationContext} from './Presentation'
export {CitationContext} from './Citations'
export {default as AnimateSVG} from './AnimateSVG'
// export {default as Image} from './Image'
export {default as Show} from './Show'
export {InlineMath, DisplayMath, m, M} from './LaTeX'
export {default as MObject} from './MObject'
export {default as Portal} from './Portal'
// Presentation.js
export {default as Notes} from './PresenterNotes'
export {range} from './utils'
export {timeline, _internalTimeline} from './timeline'
export {default as formulas} from './formulas'
export {default as Morph} from './Morph'
export {getSlidesInfo} from './staticAnalysis'
export {themes}
