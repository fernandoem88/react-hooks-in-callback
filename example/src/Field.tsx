import React, { useRef, useState } from "react";
import { useFormikContext } from "formik";
import { useHooksInCallback } from "react-hooks-in-callback";

const mainStyle = {};
const font15 = { fontSize: 15 };
const clickStyle = {};
const renderStyle = {};

export const MyField = ({ name }: { name: string }) => {
  // let's remove formik context from the component
  // const formik = useFormikContext();
  // value is updated on each click event.
  const [value, setValue] = useState(0);
  // rerenderRef value is updated only when there is a render: so it's a passive value
  const rerenderRef = useRef(0);

  rerenderRef.current += 1;
  const [HooksWrapper, getHookState] = useHooksInCallback();

  return (
    <div
      style={mainStyle}
      onClick={async () => {
        const formik = await getHookState(useFormikContext);
        const nextValue = value + 1;
        setValue(nextValue);
        formik.setFieldValue(name, nextValue);
        // you can check the updated formik field value
        // const [field] = await getHookState(function useOnce() {
        //  return useField(props.name);
        // });
        // console.log("field value", field.value);
      }}
    >
      <HooksWrapper />
      <div>{name}</div>
      <div style={font15}>
        Total Clicks:&nbsp;&nbsp;
        <span style={clickStyle}>{value}</span>
      </div>
      <div style={font15}>
        Total Render:&nbsp;&nbsp;
        <span style={renderStyle}>{rerenderRef.current}</span>
      </div>
    </div>
  );
};
