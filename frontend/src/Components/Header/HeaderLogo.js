import React from "react";
import s from "./header-logo.module.css";

const HeaderLogo = ({ logo }) => {
  return <div className={s.logo}>{logo}</div>;
};

export default HeaderLogo;
