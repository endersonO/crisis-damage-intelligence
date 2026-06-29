"use client";

import dynamic from "next/dynamic";
import BootSkeleton from "./BootSkeleton";

const OperationsConsole = dynamic(() => import("./OperationsConsole"), {
  ssr: false,
  loading: () => <BootSkeleton />,
});

export default function ClientConsole() {
  return <OperationsConsole />;
}
