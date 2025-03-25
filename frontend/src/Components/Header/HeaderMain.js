import React, { useState, useRef, createRef, useEffect } from "react";
import PropTypes from "prop-types";
import { gsap } from 'gsap/all';
import HeaderNav from "./HeaderNav";
import HeaderLogo from "./HeaderLogo";
import HeaderBurger from "./HeaderBurger";
import { useMediaQuery } from "./hooks/hooks";
import s from "./header-main.module.css";

const HeaderMain = ({ items, logo, navPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 989px)");

  const navRef = useRef();

  const [navItems] = useState(
    (items || []).map(item => ({
      ...item,
      ref: createRef()
    }))
  );
  

  const [menuTL] = useState(
    gsap.timeline({
      paused: true,
      defaults: { duration: 1, ease: "expo.out" }
    })
  );

  useEffect(() => {
    const itemsRefs = navItems.map(item => item.ref.current);

    if (navPosition === "right" || navPosition === "center") {
      if (isSmallScreen) {
        menuTL
          .fromTo(navRef.current, { opacity: 0 }, { opacity: 1 })
          .fromTo(
            itemsRefs,
            { autoAlpha: 0, y: 48 },
            { autoAlpha: 1, y: 0, stagger: 0.1 },
            "-=0.4"
          )
          .reverse();
      } else {
        menuTL.seek(0).clear().pause();
        gsap.set([navRef.current, itemsRefs], { clearProps: "all" });
      }
    }
  }, [isSmallScreen, navItems, navPosition, menuTL]);

  useEffect(() => {
    if (navPosition === "overlay") {
      const itemsRefs = navItems.map(item => item.ref.current);

      menuTL
        .fromTo(navRef.current, { opacity: 0 }, { opacity: 1 })
        .fromTo(
          itemsRefs,
          { autoAlpha: 0, y: 48 },
          { autoAlpha: 1, y: 0, stagger: 0.1 },
          "-=0.4"
        )
        .reverse();
    }
  }, [navItems, navPosition, menuTL]);

  useEffect(() => {
    menuTL.reversed(!isMenuOpen);
  }, [isMenuOpen, menuTL]);

  const toggleNav = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={s.header}>
      <div className={s.header__wrapper} data-nav-position={navPosition}>
        <HeaderLogo logo={logo} />
        <HeaderNav items={navItems} isMenuOpen={isMenuOpen} ref={navRef} />
        <HeaderBurger toggleNav={toggleNav} isMenuOpen={isMenuOpen} />
      </div>
    </header>
  );
};

HeaderMain.propTypes = {
  items: PropTypes.array.isRequired,
  logo: PropTypes.element.isRequired,
  navPosition: PropTypes.oneOf(["center", "right", "overlay"])
};

HeaderMain.defaultProps = {
  navPosition: "center"
};

export default HeaderMain;
