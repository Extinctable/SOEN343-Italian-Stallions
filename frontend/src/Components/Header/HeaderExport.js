import React from "react";
import "./styles/styles.css";
import navigation from "./data/data";
import Logo from "../../stallion logo.webp"

import HeaderMain from "./HeaderMain";

export default function HeaderExport() {
  return (
    <div className="App">
      <HeaderMain items={navigation} logo={<img src={Logo} alt="Logo" height={150} />} navPosition="center" />
      
    </div>
  );
}
