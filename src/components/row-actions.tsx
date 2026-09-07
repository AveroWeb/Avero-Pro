"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteMenuItem } from "@/components/delete-menu-item";

export function RowActions({
  editHref,
  deleteAction,
  deleteConfirmMessage,
}: {
  editHref: string;
  deleteAction: () => Promise<void>;
  deleteConfirmMessage: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={editHref} />}>
            <Pencil className="size-4" />
            Modifier
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DeleteMenuItem action={deleteAction} confirmMessage={deleteConfirmMessage} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
