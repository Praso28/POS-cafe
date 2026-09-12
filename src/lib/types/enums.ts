/**
 * Centralized TypeScript Enums for the Café POS System
 * 
 * This file contains all enum definitions used throughout the application
 * to ensure type safety and consistency.
 */

// Order Status Enum
export enum OrderStatus {
    OPEN = "open",
    PAID = "paid",
    SENT = "sent",
    PREPARING = "preparing",
    COMPLETED = "completed"
}

// Payment Method Type Enum
export enum PaymentMethodType {
    CASH = "cash",
    DIGITAL = "digital",
    UPI = "upi"
}

// Payment Status Enum
export enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed"
}

// POS Session Status Enum
export enum SessionStatus {
    OPEN = "open",
    CLOSED = "closed"
}

// Helper functions to convert between enum and string
export const OrderStatusValues = Object.values(OrderStatus);
export const PaymentMethodTypeValues = Object.values(PaymentMethodType);
export const PaymentStatusValues = Object.values(PaymentStatus);
export const SessionStatusValues = Object.values(SessionStatus);

// Type guards
export function isValidOrderStatus(status: string): status is OrderStatus {
    return OrderStatusValues.includes(status as OrderStatus);
}

export function isValidPaymentMethodType(type: string): type is PaymentMethodType {
    return PaymentMethodTypeValues.includes(type as PaymentMethodType);
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
    return PaymentStatusValues.includes(status as PaymentStatus);
}

export function isValidSessionStatus(status: string): status is SessionStatus {
    return SessionStatusValues.includes(status as SessionStatus);
}

// Display labels for UI
export const OrderStatusLabels: Record<OrderStatus, string> = {
    [OrderStatus.OPEN]: "Open",
    [OrderStatus.PAID]: "Paid",
    [OrderStatus.SENT]: "Sent to Kitchen",
    [OrderStatus.PREPARING]: "Preparing",
    [OrderStatus.COMPLETED]: "Completed"
};

export const PaymentMethodTypeLabels: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CASH]: "Cash",
    [PaymentMethodType.DIGITAL]: "Digital/Card",
    [PaymentMethodType.UPI]: "UPI"
};

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: "Pending",
    [PaymentStatus.COMPLETED]: "Completed"
};

export const SessionStatusLabels: Record<SessionStatus, string> = {
    [SessionStatus.OPEN]: "Open",
    [SessionStatus.CLOSED]: "Closed"
};

// Color mappings for UI badges
export const OrderStatusColors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    [OrderStatus.OPEN]: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
    [OrderStatus.PAID]: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    [OrderStatus.SENT]: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    [OrderStatus.PREPARING]: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
    [OrderStatus.COMPLETED]: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" }
};

export const PaymentStatusColors: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
    [PaymentStatus.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
    [PaymentStatus.COMPLETED]: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" }
};

