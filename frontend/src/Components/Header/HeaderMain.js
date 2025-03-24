import React from "react";
import "./styles/styles.css";
import navigation from "./data/data";
import Logo from "../../stallion logo.webp"

import HeaderLanding from "./HeaderLanding";

export default function Main() {
  return (
    <div className="App">
      <HeaderLanding items={navigation} logo={<img src={Logo} alt="Logo" height={150} />} navPosition="center" />
      
    </div>
  );
}
