// ======================================
// CALCULATE VOLUMETRIC WEIGHT
// ======================================

exports.calculateVolumetricWeight = (
    length,
    width,
    height
) => {

    return (
        (length * width * height) / 5000
    );
};


// ======================================
// GET CHARGEABLE WEIGHT
// ======================================

exports.getChargeableWeight = (
    actualWeight,
    volumetricWeight
) => {

    return Math.max(
        actualWeight,
        volumetricWeight
    );
};