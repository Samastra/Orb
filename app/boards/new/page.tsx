// app/boards/new/page.tsx
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function NewBoardPage() {
  const id = uuidv4();
  redirect(`/boards/${id}`);
}