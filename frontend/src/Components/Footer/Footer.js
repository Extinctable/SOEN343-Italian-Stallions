import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <div className="container-footer">
      <p>
        &copy; {new Date().getFullYear()} Stallion Speaks. All rights
        reserved.
      </p>
    </div>
  );
};

export default Footer;
