import { redirect } from "next/navigation";

export default function LegacyWorkIndexRedirect() {
  redirect("/works/creative/");
}
