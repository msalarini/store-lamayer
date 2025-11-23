"use client";

import React from "react";
import Barcode from "react-barcode";

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    fontSize?: number;
}

export const BarcodeGenerator = ({
    value,
    width = 1.5,
    height = 50,
    fontSize = 14
}: BarcodeGeneratorProps) => {
    return (
        <Barcode
            value={value}
            width={width}
            height={height}
            fontSize={fontSize}
            format="CODE128"
            displayValue={true}
            background="transparent"
        />
    );
};
