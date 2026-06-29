"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DataTableInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // We delay slightly to allow React to render the table elements first
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && window.$ && window.$.fn.DataTable) {
        const tables = window.$('.data-table');
        tables.each(function(this: any) {
          if (!window.$.fn.DataTable.isDataTable(this)) {
            window.$(this).DataTable({
              language: {
                  search: "Cari:",
                  lengthMenu: "Tampilkan _MENU_ data",
                  info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
                  paginate: {
                      first: "Pertama",
                      last: "Terakhir",
                      next: "›",
                      previous: "‹"
                  },
                  emptyTable: "Tidak ada data tersedia",
                  zeroRecords: "Data tidak ditemukan"
              },
              responsive: true,
              pageLength: 10,
              destroy: true
            });
          }
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

declare global {
  interface Window {
    $: any;
  }
}
