import type { CSSProperties } from "react";
import { ClipLoader } from "react-spinners";

interface LoadingProps {
  color?: string;
  size?: number;
  backgroundColor?: string;
}

const Loading: React.FC = ({ color = "#34d399", size = 60, backgroundColor = "rgb(19, 19, 19)" }: LoadingProps) => {
  const loaderStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor,
    zIndex: 9999,
  };

  return (
    <div style={loaderStyle}>
      <ClipLoader
        color={color}
        cssOverride={{
          borderWidth: "6px",
        }}
        loading={true}
        size={size}
        speedMultiplier={2}
      />
    </div>
  );
};
export default Loading;
