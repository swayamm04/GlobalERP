/**
 * Specialized calculation utility for metal industry ERP.
 * Handles 'feet' units where decimal part represents inches (Base 12).
 * e.g., "4.10" = 4 feet 10 inches = 4.8333 feet.
 */

// Units that use Base 12 (Feet/Inches)
export const FEET_UNITS = ["feet", "ft", "inches", "in"];

export const isBase12Unit = (unit: string = ""): boolean => {
    return FEET_UNITS.includes(unit.toLowerCase().trim());
};

export const getCalculationMultiplier = (value: string | number | undefined, unit: string = ""): number => {
    if (value === undefined || value === null || value === "") return 1;

    const strValue = value.toString().trim();
    if (strValue === "0" || strValue === "") return 1;

    const isFeetUnit = isBase12Unit(unit);

    // Normal numeric conversion for standard units (kg, g, gram, liter, etc.)
    if (!isFeetUnit) {
        const num = parseFloat(strValue);
        return isNaN(num) ? 1 : num;
    }

    // Specialized conversion for 'feet' (Base 12 for inches)
    // Format: "feet.inches" (e.g., 4.10, 5.1, 0.6)
    const parts = strValue.split('.');

    // If no decimal, treat as pure feet
    if (parts.length === 1) {
        const feet = parseFloat(parts[0]);
        return isNaN(feet) ? 1 : feet;
    }

    const feet = parseFloat(parts[0]) || 0;
    const inches = parseFloat(parts[1]) || 0;

    // Calculation: feet + (inches / 12)
    // e.g., 4.10 -> 4 + 10/12 = 4.8333
    // e.g., 4.1  -> 4 + 1/12  = 4.0833
    const decimalFeet = feet + (inches / 12);

    return decimalFeet || 1; // Fallback to 1 if result is 0
};
