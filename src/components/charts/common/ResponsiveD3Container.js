import React, { useState, useLayoutEffect, useRef, useCallback } from "react";

const ResponsiveD3Container = ({ children, width = "100%", height = 400, debounceTime = 100 }) => {
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [dimensions, setDimensions] = useState({
    width: null,
    height: typeof height === "number" ? height : 400,
  });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width: containerWidth } = containerRef.current.getBoundingClientRect();
    const newHeight = typeof height === "number" ? height : 400;
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
