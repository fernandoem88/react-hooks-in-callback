import React, { useState } from "react";
import { Store } from "../utils/store";

const Channel: React.FC<{
  id: string;
  getStore: () => Store;
  name: string;
}> = React.memo(function Channel(props) {
  const [store] = useState(props.getStore);
  const [useChannelHook] = useState(() => store.getChannelById(props.id).hook);
  useChannelHook();
  return <></>;
});

export default Channel;
