"use client";

import { QRCodeSVG } from "qrcode.react";

interface UPIQRProps {
    upiId: string;
    amount: number;
    name?: string;
}

export function UPIQR({ upiId, amount, name = "Cafe" }: UPIQRProps) {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount.toFixed(2)}&pn=${encodeURIComponent(name)}&cu=INR`;

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl">
            <QRCodeSVG
                value={upiUrl}
                size={200}
                level="H"
                includeMargin
                className="rounded-lg"
            />
            <div className="text-center">
                <p className="text-lg font-semibold">Scan to Pay</p>
                <p className="text-3xl font-bold text-green-600">₹{amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">{upiId}</p>
            </div>
        </div>
    );
}
