import { useState } from 'react'
import { createActionUtils } from '../utils/createHookPortal'

const useHooksInCallback = () => {
  const [state] = useState(() => {
    console.log('defining useHooksInCallback')
    const { getHookState, HooksWrapper } = createActionUtils({})
    return [HooksWrapper, getHookState] as [
      typeof HooksWrapper,
      typeof getHookState
    ]
  })
  return state
}

export default useHooksInCallback
