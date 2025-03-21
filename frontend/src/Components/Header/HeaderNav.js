import React from "react";
import s from "./header-nav.module.css";

const HeaderNav = React.forwardRef(({ items, isMenuOpen }, ref) => {
  const openClass = isMenuOpen ? s.open : "";

  return (
    <nav className={`${s.nav} ${openClass}`} ref={ref}>
      {items.map(item => (
        <a
          href={item.slug}
          key={item.id}
          className={`${s.nav__item}`}
          ref={item.ref}
        >
          {item.name}
        </a>
      ))}
    </nav>
  );
});

export default HeaderNav;
