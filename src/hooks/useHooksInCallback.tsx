import { useState } from 'react'
import { createActionsPackage } from '../utils/create-package'

const useHooksInCallback = () => {
  const [state] = useState(() => {
    const {
      getHookState,
      HooksWrapper,
      subscribeToHookState
    } = createActionsPackage()
    return [HooksWrapper, getHookState, subscribeToHookState] as const
  })
  return state
}

export default useHooksInCallback
