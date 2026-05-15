export const getGradeStatus = (normal, rattrapage) => {
    // If normal is 10 or more, they passed (V)
    if (normal >= 10) return { status: 'V', color: 'text-green-600 bg-green-100' };
    
    // If normal is less than 10, check rattrapage
    if (rattrapage !== null && rattrapage !== undefined) {
        if (rattrapage >= 10) return { status: 'V', color: 'text-green-600 bg-green-100' };
        return { status: 'Ratt', color: 'text-red-600 bg-red-100' };
    }

    // If normal < 10 and no rattrapage yet
    return { status: 'Ratt', color: 'text-red-600 bg-red-100' };
};