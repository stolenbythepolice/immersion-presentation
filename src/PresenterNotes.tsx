import React from 'react'

// FIXME would be more logical if this simply returned null
// The presenter notes get picked up by staticAnalysis.js and it's children get rendered elsewhere
export default function Notes(): React.ReactNode {
  return <div />
}
