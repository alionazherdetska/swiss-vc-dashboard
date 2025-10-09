import React, { useState, useEffect, useRef } from "react";

const ResponsiveD3Container = ({
  children,
  width = "100%",
  height = 400,
  debounceTime = 100,
}) => {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width: containerWidth } =
          containerRef.current.getBoundingClientRect();
        setDimensions({
          width: containerWidth || 800,
          height: typeof height === "number" ? height : 400,
        });
      }
    };

    // Initial size calculation
    updateDimensions();

    // Debounced resize handler
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, debounceTime);
    };

    window.addEventListener("resize", handleResize);

    // ResizeObserver for more accurate container size changes
    let resizeObserver;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [debounceTime, height]);

  return (
    <div
      ref={containerRef}
      className="d3-chart-container"
      style={{
        width: typeof width === "string" ? width : `${width}px`,
        height: typeof height === "string" ? height : `${height}px`,
        minHeight: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              width: dimensions.width,
              height: dimensions.height,
              ...child.props,
            })
          : child,
      )}
    </div>
  );
};

export default ResponsiveD3Container;
