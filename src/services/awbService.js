exports.generateAWB = () => {

    const now = new Date();

    const year = now.getFullYear().toString().slice(-2);

    const month = String(now.getMonth() + 1).padStart(2, '0');

    const day = String(now.getDate()).padStart(2, '0');

    const random = Math.floor(100000 + Math.random() * 900000);

    return `EMS${year}${month}${day}${random}`;
};