/**
 * Specialized calculation utility for metal industry ERP.
 * Handles 'feet' units where decimal part represents inches (Base 12).
 * e.g., "4.10" = 4 feet 10 inches = 4.8333 feet.
 */

// Units that use Base 12 (Feet/Inches)
export const FEET_UNITS = ["feet", "ft", "inches", "in"];

export const isBase12Unit = (unit: string = ""): boolean => {
    return false;
};

export const getCalculationMultiplier = (value: string | number | undefined, unit: string = ""): number => {
    if (value === undefined || value === null || value === "") return 1;

    const strValue = value.toString().trim();
    if (strValue === "0" || strValue === "") return 1;

    const num = parseFloat(strValue);
    return isNaN(num) || num === 0 ? 1 : num;
};
