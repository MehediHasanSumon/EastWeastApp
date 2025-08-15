import type React from "react";
import { ScaleLoader } from "react-spinners";

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full py-4">
      <ScaleLoader barCount={10} color="#34d399" height={40} margin={5} radius={2} speedMultiplier={3} width={5} />
    </div>
  );
};

export default Loader;
