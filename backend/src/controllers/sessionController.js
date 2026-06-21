const VALID_DISTRICTS = new Set([
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Monaragala', 'Ratnapura', 'Kegalle',
]);

export function getDistrict(req, res) {
    res.json({
        success: true,
        district: req.session.district || null,
    });
}

export function setDistrict(req, res) {
    const { district } = req.body;
    if (district === null) {
        req.session.district = null;
        return res.json({ success: true, district: null });
    }
    if (typeof district !== 'string' || !VALID_DISTRICTS.has(district)) {
        return res.status(400).json({
            success: false,
            error: `Invalid district. Must be one of: ${[...VALID_DISTRICTS].join(', ')}`,
        });
    }
    req.session.district = district;
    res.json({ success: true, district });
}

export function listDistricts(_req, res) {
    res.json({ success: true, districts: [...VALID_DISTRICTS] });
}
