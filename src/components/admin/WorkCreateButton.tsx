"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkEditModal } from "@/components/admin/WorkEditModal";

type Props = {
  /** Chooning など、新規作成時に付与する product_key */
  productKey?: string | null;
};

export function WorkCreateButton({ productKey = null }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        ＋ コンテンツを追加
      </Button>
      <WorkEditModal
        open={open}
        onClose={() => setOpen(false)}
        productKey={productKey}
      />
    </>
  );
}
