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
                    unit: string | null;
                    tax: number;
                    description: string | null;
                    active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    category: string;
                    price: number;
                    unit?: string | null;
                    tax?: number;
                    description?: string | null;
                    active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    category?: string;
                    price?: number;
                    unit?: string | null;
                    tax?: number;
                    description?: string | null;
                    active?: boolean;
                    created_at?: string;
                };
            };
            floors: {
                Row: {
                    id: string;
                    name: string;
                    active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    active?: boolean;
                    created_at?: string;
                };
            };
            tables: {
                Row: {
                    id: string;
                    name: string;
                    seats: number;
                    floor_id: string | null;
                    active: boolean;
                    appointment_resource: string | null;
                    status: "available" | "occupied" | "reserved" | "cleaning";
                    current_order_id: string | null;
                    occupied_at: string | null;
                    reserved_at: string | null;
                    reserved_until: string | null;
                    reservation_name: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    seats: number;
                    floor_id?: string | null;
                    active?: boolean;
                    appointment_resource?: string | null;
                    status?: "available" | "occupied" | "reserved" | "cleaning";
                    current_order_id?: string | null;
                    occupied_at?: string | null;
                    reserved_at?: string | null;
                    reserved_until?: string | null;
                    reservation_name?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    seats?: number;
                    floor_id?: string | null;
                    active?: boolean;
                    appointment_resource?: string | null;
                    status?: "available" | "occupied" | "reserved" | "cleaning";
                    current_order_id?: string | null;
                    occupied_at?: string | null;
                    reserved_at?: string | null;
                    reserved_until?: string | null;
                    reservation_name?: string | null;
                };
            };
            pos_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    opened_at: string;
                    closed_at: string | null;
                    status: "open" | "closed";
                    closing_total: number;
                    terminal_id: string | null;
                    session_name: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    opened_at?: string;
                    closed_at?: string | null;
                    status?: "open" | "closed";
                    closing_total?: number;
                    terminal_id?: string | null;
                    session_name?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    opened_at?: string;
                    closed_at?: string | null;
                    status?: "open" | "closed";
                    closing_total?: number;
                    terminal_id?: string | null;
                    session_name?: string | null;
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
                    token_id: string | null;
                    order_type: "dine-in" | "takeaway" | "delivery" | "pickup" | "drive-thru";
                    order_number: number | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    notes: string | null;
                    estimated_ready_at: string | null;
                };
                Insert: {
                    id?: string;
                    table_id: string;
                    session_id: string;
                    status?: "open" | "sent" | "preparing" | "completed" | "paid";
                    total?: number;
                    created_at?: string;
                    token_id?: string | null;
                    order_type?: "dine-in" | "takeaway" | "delivery" | "pickup" | "drive-thru";
                    order_number?: number | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    notes?: string | null;
                    estimated_ready_at?: string | null;
                };
                Update: {
                    id?: string;
                    table_id?: string;
                    session_id?: string;
                    status?: "open" | "sent" | "preparing" | "completed" | "paid";
                    total?: number;
                    created_at?: string;
                    token_id?: string | null;
                    order_type?: "dine-in" | "takeaway" | "delivery" | "pickup" | "drive-thru";
                    order_number?: number | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    notes?: string | null;
                    estimated_ready_at?: string | null;
                };
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string;
                    qty: number;
                    price: number;
                    prepared: boolean;
                    prepared_at: string | null;
                    variant_id: string | null;
                    variant_label: string | null;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    product_id: string;
                    qty?: number;
                    price: number;
                    prepared?: boolean;
                    prepared_at?: string | null;
                    variant_id?: string | null;
                    variant_label?: string | null;
                };
                Update: {
                    id?: string;
                    order_id?: string;
                    product_id?: string;
                    qty?: number;
                    price?: number;
                    prepared?: boolean;
                    prepared_at?: string | null;
                    variant_id?: string | null;
                    variant_label?: string | null;
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
            product_variants: {
                Row: {
                    id: string;
                    product_id: string;
                    attribute_name: string;
                    attribute_value: string;
                    extra_price: number;
                    active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    product_id: string;
                    attribute_name: string;
                    attribute_value: string;
                    extra_price?: number;
                    active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    product_id?: string;
                    attribute_name?: string;
                    attribute_value?: string;
                    extra_price?: number;
                    active?: boolean;
                    created_at?: string;
                };
            };
            order_tokens: {
                Row: {
                    id: string;
                    token: string;
                    table_id: string;
                    session_id: string;
                    active: boolean;
                    created_at: string;
                    expires_at: string | null;
                };
                Insert: {
                    id?: string;
                    token: string;
                    table_id: string;
                    session_id: string;
                    active?: boolean;
                    created_at?: string;
                    expires_at?: string | null;
                };
                Update: {
                    id?: string;
                    token?: string;
                    table_id?: string;
                    session_id?: string;
                    active?: boolean;
                    created_at?: string;
                    expires_at?: string | null;
                };
            };
            pos_terminals: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    location: string | null;
                    terminal_type: "counter" | "self-service" | "drive-thru" | "mobile" | "kiosk";
                    active: boolean;
                    settings: Record<string, unknown>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    location?: string | null;
                    terminal_type?: "counter" | "self-service" | "drive-thru" | "mobile" | "kiosk";
                    active?: boolean;
                    settings?: Record<string, unknown>;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    location?: string | null;
                    terminal_type?: "counter" | "self-service" | "drive-thru" | "mobile" | "kiosk";
                    active?: boolean;
                    settings?: Record<string, unknown>;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            user_roles: {
                Row: {
                    id: string;
                    user_id: string;
                    role: "admin" | "manager" | "cashier" | "kitchen" | "viewer";
                    permissions: Record<string, unknown>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    role: "admin" | "manager" | "cashier" | "kitchen" | "viewer";
                    permissions?: Record<string, unknown>;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    role?: "admin" | "manager" | "cashier" | "kitchen" | "viewer";
                    permissions?: Record<string, unknown>;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            customer_display_sessions: {
                Row: {
                    id: string;
                    terminal_id: string | null;
                    current_order_id: string | null;
                    display_mode: "order" | "welcome" | "thankyou" | "idle";
                    last_activity_at: string;
                    auto_reset_seconds: number;
                    settings: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    terminal_id?: string | null;
                    current_order_id?: string | null;
                    display_mode?: "order" | "welcome" | "thankyou" | "idle";
                    last_activity_at?: string;
                    auto_reset_seconds?: number;
                    settings?: Record<string, unknown>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    terminal_id?: string | null;
                    current_order_id?: string | null;
                    display_mode?: "order" | "welcome" | "thankyou" | "idle";
                    last_activity_at?: string;
                    auto_reset_seconds?: number;
                    settings?: Record<string, unknown>;
                    created_at?: string;
                };
            };
        };
    };
}

// Convenience types
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Floor = Database["public"]["Tables"]["floors"]["Row"];
export type CafeTable = Database["public"]["Tables"]["tables"]["Row"];
export type PosSession = Database["public"]["Tables"]["pos_sessions"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type OrderToken = Database["public"]["Tables"]["order_tokens"]["Row"];
export type PosTerminal = Database["public"]["Tables"]["pos_terminals"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type CustomerDisplaySession = Database["public"]["Tables"]["customer_display_sessions"]["Row"];

// Role type for convenience
export type RoleType = "admin" | "manager" | "cashier" | "kitchen" | "viewer";
export type OrderType = "dine-in" | "takeaway" | "delivery" | "pickup" | "drive-thru";
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

// Extended types with relations
export type TableWithFloor = CafeTable & {
    floors: Floor | null;
};

export type ProductWithVariants = Product & {
    product_variants: ProductVariant[];
};

export type OrderWithItems = Order & {
    order_items: (OrderItem & { products: Product })[];
    tables: CafeTable;
};

export type PosSessionWithTerminal = PosSession & {
    pos_terminals: PosTerminal | null;
};
