import React, { useState, useLayoutEffect, useRef, useCallback } from "react";

const ResponsiveD3Container = ({ children, width = "100%", height = 400, debounceTime = 100 }) => {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Start with unknown width so we don't render children until we have
  // a reliable measurement. This avoids a flash where charts render
  // with a fallback width then resize (causing the 'growing' effect).
  const [dimensions, setDimensions] = useState({
    width: null,
    height: typeof height === "number" ? height : 400,
  });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width: containerWidth } = containerRef.current.getBoundingClientRect();
    const newHeight = typeof height === "number" ? height : 400;

    // Only set a measured width when we have a positive value. Avoid
    // falling back to arbitrary defaults because that causes an extra
    // render with the wrong size.
    const measuredWidth = containerWidth ? Math.round(containerWidth) : null;

    setDimensions((prevDims) => {
      if (prevDims.width === measuredWidth && prevDims.height === newHeight) {
        return prevDims;
      }
      return { width: measuredWidth, height: newHeight };
    });
  }, [height]);

  const handleResize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(updateDimensions, debounceTime);
  }, [debounceTime, updateDimensions]);

  // Use useLayoutEffect so we measure synchronously before the browser
  // paints. This prevents the initial paint with an incorrect size that
  // later changes and appears to 'grow'.
  useLayoutEffect(() => {
    updateDimensions();
    window.addEventListener("resize", handleResize);

    if (window.ResizeObserver && containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [debounceTime, handleResize, updateDimensions]);

  const containerStyle = {
    width: typeof width === "string" ? width : `${width}px`,
    height: typeof height === "string" ? height : `${height}px`,
    minHeight: typeof height === "number" ? `${height}px` : height,
  };

  // If we haven't measured the container width yet, render the wrapper
  // element only (keeps layout stable) and wait for measurement before
  // rendering the chart children. This avoids an initial render with a
  // fallback size that jumps immediately after measuring.
  return (
    <div ref={containerRef} className="d3-chart-container" style={containerStyle}>
      {dimensions.width == null
        ? null
        : React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  width: dimensions.width,
                  height: dimensions.height,
                  ...child.props,
                })
              : child
          )}
    </div>
  );
};

ResponsiveD3Container.displayName = "ResponsiveD3Container";

export default ResponsiveD3Container;
