export type ExpenseCategory = "stock" | "transport" | "rent" | "staff" | "data" | "packaging" | "utilities" | "other";

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "stock", label: "Stock or ingredients" },
  { id: "transport", label: "Transport" },
  { id: "rent", label: "Rent" },
  { id: "staff", label: "Staff pay" },
  { id: "data", label: "Data and airtime" },
  { id: "packaging", label: "Packaging" },
  { id: "utilities", label: "Power and water" },
  { id: "other", label: "Something else" },
];

/** Money is whole kobo everywhere (₦1 = 100 kobo), so sums are exact. */
export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  archived?: boolean;
}

export interface SaleItem {
  productId?: string;
  /** Copied at the time of sale, so renaming a product later doesn't rewrite history. */
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  at: string;
  amount: number;
  items: SaleItem[];
  note?: string;
  customer?: string;
  /** false = the customer still owes this. */
  paid: boolean;
  paidAt?: string;
  /** Soft delete: other devices learn about it, and it can be undone. */
  deletedAt?: string;
}

export interface Expense {
  id: string;
  at: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  deletedAt?: string;
}

export type RecordKind = "sale" | "expense";
