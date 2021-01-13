import React, { useState } from 'react'
import { MyForm } from './Form'

import { createCleanContext } from 'react-hooks-in-callback'
const ctxValue = { x: 1, title: 'pippo-test' }
export const { Provider, useCleanContext } = createCleanContext(ctxValue)

export default () => {
  const [state, setState] = useState(ctxValue)
  return (
    <Provider value={state}>
      <button
        onClick={() => {
          setState((s) => {
            return { ...s, x: s.x + 1 }
          })
        }}
      >
        increment x
      </button>
      <MyForm />
    </Provider>
  )
}
