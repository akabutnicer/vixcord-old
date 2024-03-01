import React from "react";
export default (props) => {
  return <span {...props.attributes}>{props.children}</span>;
};
