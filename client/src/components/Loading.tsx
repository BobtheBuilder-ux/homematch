import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50">
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-[#00bf63] text-4xl text-[#00bf63]">
          <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-[#3871c1] text-2xl text-[#3871c1]"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
