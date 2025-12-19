import { Prisma } from '@prisma/client';

export type Status = 'RED' | 'YELLOW' | 'GREEN';

export const RPMSEngine = {
    /**
     * Calculate Achievement Percentage
     */
    calculateAchievement: (actual: number, target: number): number => {
        if (target === 0) return 0;
        return (actual / target) * 100;
    },

    /**
     * Determine Status based on rules:
     * RED: < 80%
     * YELLOW: 80% - 94.9%
     * GREEN: >= 95%
     */
    determineStatus: (percentage: number): Status => {
        if (percentage < 80) return 'RED';
        if (percentage < 95) return 'YELLOW';
        return 'GREEN';
    },

    /**
     * Forecast EOY Achievement
     * Formula: ActualYTD + (Average_Last_3_Months * Remaining_Months)
     */
    forecast: (
        actualYTD: number,
        pastMonthsData: number[], // Array of monthly actuals
        remainingMonths: number,
        growthMultiplier: number = 1.0
    ): number => {
        if (pastMonthsData.length === 0) return actualYTD;

        // Get last 3 months (or fewer if not available)
        const last3Months = pastMonthsData.slice(-3);
        const avgRunRate = last3Months.reduce((a, b) => a + b, 0) / last3Months.length;

        const projected = avgRunRate * remainingMonths * growthMultiplier;
        return actualYTD + projected;
    }
};
