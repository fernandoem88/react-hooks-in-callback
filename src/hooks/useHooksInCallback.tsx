import React from 'react'
import { createActionsPackage } from '../utils/create-package'

const useHooksInCallback = () => {
  const [state] = React.useState(() => {
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
