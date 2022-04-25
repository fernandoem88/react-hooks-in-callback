import { useState } from 'react'
import { createPackage } from '../utils/create-package'

const useHooksInCallback = () => {
  const [state] = useState(() => {
    const [getHookState, HooksWrapper, subscribeToHookState] = createPackage()
    return [HooksWrapper, getHookState, subscribeToHookState] as const
  })
  return state
}

export default useHooksInCallback
