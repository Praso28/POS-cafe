export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string;
                    name: string;
                    category: string;
                    price: number;
                    active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    category: string;
                    price: number;
                    active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    category?: string;
                    price?: number;
                    active?: boolean;
                    created_at?: string;
                };
            };
            tables: {
                Row: {
                    id: string;
                    name: string;
                    seats: number;
                    active: boolean;
                };
                Insert: {
                    id?: string;
                    name: string;
                    seats: number;
                    active?: boolean;
                };
                Update: {
                    id?: string;
                    name?: string;
                    seats?: number;
                    active?: boolean;
                };
            };
            pos_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    opened_at: string;
                    closed_at: string | null;
                    status: "open" | "closed";
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    opened_at?: string;
                    closed_at?: string | null;
                    status?: "open" | "closed";
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    opened_at?: string;
                    closed_at?: string | null;
                    status?: "open" | "closed";
                };
            };
            orders: {
                Row: {
                    id: string;
                    table_id: string;
                    session_id: string;
                    status: "open" | "sent" | "preparing" | "completed" | "paid";
                    total: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    table_id: string;
                    session_id: string;
                    status?: "open" | "sent" | "preparing" | "completed" | "paid";
                    total?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    table_id?: string;
                    session_id?: string;
                    status?: "open" | "sent" | "preparing" | "completed" | "paid";
                    total?: number;
                    created_at?: string;
                };
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string;
                    qty: number;
                    price: number;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    product_id: string;
                    qty?: number;
                    price: number;
                };
                Update: {
                    id?: string;
                    order_id?: string;
                    product_id?: string;
                    qty?: number;
                    price?: number;
                };
            };
            payment_methods: {
                Row: {
                    id: string;
                    name: string;
                    type: "cash" | "digital" | "upi";
                    upi_id: string | null;
                    enabled: boolean;
                };
                Insert: {
                    id?: string;
                    name: string;
                    type: "cash" | "digital" | "upi";
                    upi_id?: string | null;
                    enabled?: boolean;
                };
                Update: {
                    id?: string;
                    name?: string;
                    type?: "cash" | "digital" | "upi";
                    upi_id?: string | null;
                    enabled?: boolean;
                };
            };
            payments: {
                Row: {
                    id: string;
                    order_id: string;
                    method: string;
                    amount: number;
                    status: "pending" | "completed";
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    method: string;
                    amount: number;
                    status?: "pending" | "completed";
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    order_id?: string;
                    method?: string;
                    amount?: number;
                    status?: "pending" | "completed";
                    created_at?: string;
                };
            };
        };
    };
}

// Convenience types
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type CafeTable = Database["public"]["Tables"]["tables"]["Row"];
export type PosSession = Database["public"]["Tables"]["pos_sessions"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

// Extended types with relations
export type OrderWithItems = Order & {
    order_items: (OrderItem & { products: Product })[];
    tables: CafeTable;
};
