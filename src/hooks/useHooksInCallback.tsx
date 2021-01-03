import { useState } from "react";
import { createActionUtils } from "../utils";

const useHooksInCallback = () => {
  const [state] = useState(() => {
    const { getHookState, HooksWrapper } = createActionUtils({});
    return [HooksWrapper, getHookState] as [
      typeof HooksWrapper,
      typeof getHookState
    ];
  });
  return state;
};

export default useHooksInCallback;
