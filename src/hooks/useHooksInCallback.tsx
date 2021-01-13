import { useState } from 'react'
import { createActionUtils } from '../utils/createHookPortal'

const useHooksInCallback = () => {
  const [state] = useState(() => {
    const {
      getHookState,
      HooksWrapper,
      subscribeToHookState
    } = createActionUtils({})
    return [HooksWrapper, getHookState, subscribeToHookState] as [
      typeof HooksWrapper,
      typeof getHookState,
      typeof subscribeToHookState
    ]
  })
  return state
}

export default useHooksInCallback
