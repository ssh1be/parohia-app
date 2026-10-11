import type { Metadata } from "next";
import { UseTheAppMessage } from "../../components/app/DesktopGate";

export const metadata: Metadata = {
  title: "Use the Parohia app | Parohia",
};

export default function GetTheAppPage() {
  return <UseTheAppMessage />;
}
