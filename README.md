# React hooks in callback

> using hooks in callbacks in some cases will be helpful to filter out noisy hooks and in other cases to avoid defining useless and repetitive hooks in your component just to pass their values to a callback

so, This package will help us

- **to filter out unwanted hooks re-renders** (eg: react context related hooks, hooks with timeout or time interval, etc...).
- **to have a simplified version of async actions** (that will allow us to have a really nice alternative to _redux-thunk_ approach)

[![NPM](https://img.shields.io/npm/v/react-hooks-in-callback.svg)](https://www.npmjs.com/package/react-hooks-in-callback)

## Install

```bash
npm i -S react-hooks-in-callback
```

## useHooksInCallback

```typescript
import { useHooksInCallback } from "react-hooks-in-callback";
import { useMyCustomHook } from "./my-custom-hooks";
... // here is the component body
const [HooksWrapper, getHookState, subscribeToHookState] = useHooksInCallback();
// HooksWrapper: is a React component where your hooks will be mounted.
// getHookState: an helper that let you get the hook state in an async way.
// subscribeToHookState: same as getHookState, but designed to work with useEffect
...
// you can either use getHookState or subscribeToHookState, depending on your case
...
return (
    <div>
        {/* useMyCustomHook will be mounted in HooksWrapper */}
        <HooksWrapper />
        <button onClick={async () => {
            // mount useMyCustomHook and wait for its state to be resolved.
            const hookState = await getHookState(useMyCustomHook);
            // after being resolved, useMyCustomHook is directly unmounted.
        }}/>
    </div>
)
```

### Formik example

Imagine to have a list of fields where each field component uses **useFormikContext**, just to set the field value on click event.
the scenario is the following one:

```typescript
const Field = (name: string) => {
    const formik = useFormikContext();
    ...
    return (
        <div>
            <button onClick={() => formik.setFieldValue(name, newFieldValue)}/>
        <div/>
    )
}
```

The issue here is the **re-render noise** introduced by the formik context. Everytime a field will be updated, all the other fields will re-render since they are using the same react context. This will lead to a bad performance.

Check the **formik with context's re-render noise** example [here](https://codesandbox.io/s/formik-normal-5vchh?file=/src/Field.js)

We can solve that issue if we can take the _useFormikContext_ out of the Field component and get its state only when there is a click event. This is what we are going to do by using **useHooksInCallback**.

```typescript
const Field = (name: string) => {
    // const formik = useFormikContext(); // -----!
    const [HooksWrapper, getHookState] = useHooksInCallback(); // +++++!
    ...
    return (
        <div>
            <HooksWrapper /> {/* added! */}
            <button onClick={async () => {
              // formik context will be used only once in this callback
              const formik = await getHookState(useFormikContext); // +++++!
              formik.setFieldValue(name, newFieldValue)
            }}/>
        <div/>
    )
}
```

Check the **formik with hooks-in-callback** example [here](https://codesandbox.io/s/formik-with-hooks-in-callback-jeo4i?file=/src/clean/Field.js)

## createActionUtils

A place where we usually use hooks states is in a _redux-thunk_ action.
the reason to use the **react-hooks-in-callback** approach instead is because it brings some benefits.

- **your action has only one callback layer**: not a curry function like in redux-thunk approach
- **hooks based params are not defined anymore in the component but directly in the action callback**: just think if we have a login action and we need to change it in a way to push _/login_ on start and _/home_ on success, we need to have _history_ as parameter and define _const history = useHistory()_ in **every** component where our _login_ action will be used.
- **filtering unwanted re-renders as we saw previously**

### usage

first of all, we need to create utilities for our async actions

```ts
import { createActionUtils } from 'react-hooks-in-callback'

export const utils = createActionUtils(configs) // configs is an object with whatever we want
// Utils: { HooksWrapper, getHookState, getConfig, setConfig, useConfig, subscribeToHookState }
// HooksWrapper => Component to be mounted at the top level, directly under all used hooks contexts providers
// getHookState => get your hook state in an async way in your action
// getConfig => get the last config state
// setConfig => set new config state and dispatch the new state to the useConfig hook
// useConfig => use the last updated config state and rerender the component on new state
// subscribeToHookState => subscribe to hooks state changes
```

then we need to mount the HooksWrapper to process our hooks states

```ts
const MyRootComponent = (props) => {
  return (
    <Provider store={store}>
      <Router>
        {/*
          HooksWrapper is where action utils hooks will be mounted
          so it should be under the providers tree and before the components where the actions will be called.
        */}
        <HooksWrapper />
        {props.children}
      </Router>
    </Provider>
  )
}
```

now we can define a custom hook for our actions

```ts
export const useActionUtils = () => {
  const { dispatch, getState } = useStore()
  const history = useHistory()
  return { dispatch, getState, history }
}
```

and use it like follows

```ts
import { utils } from './configs'
import { useActionUtils } from './hooks'

const login = async (userId: string) => {
  // here we will mount useActionUtils in the HooksWrapper component and get its state in a promise
  const { dispatch, history } = await utils.getHookState(useActionUtils)
  const configs = utils.getConfigs()

  try {
    history.push('/login')
    dispatch({ type: 'LoginStart' })

    const { data: token } = await configs.api.login(userId)
    // setConfig to modify the config value and dispatch the new state to the useConfig hook
    utils.setConfig((cfg) => {
      // cfg is our custom config: what we defined in configs.ts
      cfg.token = token // we can access the cfg value by using useConfig in the component,
    })
    history.push('/home')
    const { data: users } = await configs.api.getUsers(token)
    dispatch({ type: 'LoginSuccess', payload: users })
    // just to check if everything is fine, you can log your redux state here
    // const storeState = utils.getState();
    // console.log(storeState)
  } catch (error) {
    dispatch({ type: 'LoginError', payload: error })
  }
}
```

As we can notice in our action, the only one parameter is _userId_. every other parameters related to hooks are defined directly in **useActionUtils** and every change depending on it will be done only in it and won't affect our components.

if it was a redux-thunk action, the synthax would be more complex, we can see the difference bellow.

```typescript
// redux-thunk action synthax
const login = (userId: string, history: History) => {
  //  hooks values/states should be passed as action params like we passed history in this example
  return async (dispatch, getState, config: Config) => {
    // action logic goes here
  }
}
// react-hooks-in-callback action synthax
const login = async (userId: string) => {
  //  hooks values/states and config are defined directly in the action body
  // action logic goes here
}
```

the last step now is to use everything in a component

```typescript
import { utils } from './configs'
import { login } from './actions'

const App = () => {
  useEffect(() => {
    // using react-hooks-in-callback approach!
    login('admin') // don't need to dispatch or to pass history
  }, [])
  // we can use useConfig in our component to get some values.
  const token = utils.useConfig((config) => config.token)
  if (!token) return <div>user not logged in</div>

  return <div>...</div>
}
```

just to compare both approaches, if we used a _redux-thunk_ way instead, we had to define _dispatch_ and _history_ in our components to dispatch the login action and pass history as parameter

```typescript
import { utils } from './configs'
import { login } from './actions'
import { useYourCustomConfig } from './hooks'

const App = () => {
  // if we used a redux-thunk action we should need dispatch and history in our component like bellow
  const dispatch = useDispatch() // +++++
  const history = useHistory() // +++++

  useEffect(() => {
    dispatch(
      // we need to dispatch an action passing also history
      login('admin', history)
    )
  }, [dispatch])

  const token = useYourCustomConfig((config) => config.token)
  if (!token) return <div>user not logged in</div>

  return <div>...</div>
}
```

You can find the redux sandbox example [here](https://codesandbox.io/s/redux-with-hooks-in-callback-bzzjb?file=/src/actions.js)

Try it out!

# Advanced

## Waiting for a specific state before resolving the getHookState

sometimes your expected hook state is not the first provided one and you should wait for a specific state before resolving the **getHookState** value.

For example this following hooks returns the total number of divs in the DOM, but initially returns _undefined_.

```typescript
const useDivCount = () => {.
  const [state, setState] = useState<number>();
  useEffect(() => {
    const divs = document.querySelectorAll("div");
    setState(divs?.length || 0);
  }, []);
  return state; // undefined | number
};
```

So in this case what we want to do is to skip the undefined value and wait for the number value.

```typescript
const hookState = await getHookState(
  useDivCount,
  (state, utils) => {
    if (state !== undefined) {
      utils.resolve(state)
      return
    }
    if (utils.isBeforeUnmount) {
      // this should not happen normally, but if it happens and
      // you did not resolve the getHookState and some how you are unmounting the component
      // you should do something to not keep this promise in pending state
      // resolve your state or
      // use utils.reject or throw some error
    }
  },
  'useDivCount' // (optional) This parameter is just for debugging purpose,so you can check which hook is still mounted in react dev tools in your browser
)
```

you can also subscribe to state changes in useEffect using _subscribeToHookState_

```typescript
const [HooksWrapper, , subscribeToHookState] = useHooksInCallback()
useEffect(() => {
  const subscription = subscribeToHookState(
    useDivCount,
    (state, isBeforeUnmount) => {
      // subscription logic goes here
    },
    'useDivCountSubscription' // (optional) This parameter is just for debugging purpose
  )
  return subscription.unsubscribe
}, [])
```

Find an advanced example [here](https://codesandbox.io/s/waiting-for-a-specific-state-ilqtv?file=/src/UserPass.js)

## see also

- [react-requests-manager](https://www.npmjs.com/package/react-requests-manager)

- [react-context-selector](https://www.npmjs.com/package/react-context-selector)

- [react-redux-selector-utils](https://www.npmjs.com/package/react-redux-selector-utils)
