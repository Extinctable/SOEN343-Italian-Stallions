import { useState, useEffect } from "react";

const useMediaQuery = mediaQuery => {
  const [state, setState] = useState(false);

  const handleMediaQueryChange = theMediaQuery => {
    if (theMediaQuery.matches) {
      setState(true);
    } else {
      setState(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const theMediaQuery = window.matchMedia(mediaQuery);
      theMediaQuery.addListener(handleMediaQueryChange);
      handleMediaQueryChange(theMediaQuery);

      return () => {
        theMediaQuery.removeListener(handleMediaQueryChange);
      };
    } else {
      setState(false);
    }
  }, [mediaQuery]);

  return state;
};

export default useMediaQuery;
