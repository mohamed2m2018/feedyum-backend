jest.mock('../models/chefApplication', () => ({ create: jest.fn() }));
jest.mock('../services/emailService', () => ({ sendChefApplicationNotification: jest.fn() }));

const ChefApplication = require('../models/chefApplication');
const emailService = require('../services/emailService');
const createChefApplication = require('../controllers/chefApplicationController/createChefApplication');
const { validateChefApplication } = createChefApplication;

const validBody = {
    name: 'Mona Ali',
    businessName: "Mona's Kitchen",
    businessType: 'home_chef',
    phone: '+20 100 123 4567',
    email: 'mona@example.com',
    area: 'Nasr City, Cairo',
    cuisine: 'Egyptian home food',
    language: 'ar',
};

function mockRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

describe('validateChefApplication', () => {
    it('accepts a complete application and trims values', () => {
        const { data, errors } = validateChefApplication({ ...validBody, name: '  Mona Ali  ' });
        expect(errors).toBeUndefined();
        expect(data.name).toBe('Mona Ali');
        expect(data.language).toBe('ar');
    });

    it('requires name, a valid phone, area and business type', () => {
        const { errors } = validateChefApplication({ name: 'M', phone: 'abc', area: '', businessType: 'cafe' });
        expect(Object.keys(errors).sort()).toEqual(['area', 'businessType', 'name', 'phone']);
    });

    it('allows a missing email but rejects a malformed one', () => {
        expect(validateChefApplication({ ...validBody, email: '' }).errors).toBeUndefined();
        expect(validateChefApplication({ ...validBody, email: 'not-an-email' }).errors).toHaveProperty('email');
    });

    it('rejects values longer than the field limit', () => {
        const { errors } = validateChefApplication({ ...validBody, notes: 'x'.repeat(1001) });
        expect(errors).toHaveProperty('notes');
    });

    it('defaults language to en for anything other than ar', () => {
        expect(validateChefApplication({ ...validBody, language: 'fr' }).data.language).toBe('en');
    });
});

describe('createChefApplication', () => {
    it('silently accepts honeypot submissions without saving', async () => {
        const res = mockRes();
        await createChefApplication({ body: { ...validBody, website: 'http://spam.example' } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(ChefApplication.create).not.toHaveBeenCalled();
        expect(emailService.sendChefApplicationNotification).not.toHaveBeenCalled();
    });

    it('returns 400 with field errors for invalid input', async () => {
        const res = mockRes();
        await createChefApplication({ body: { name: '' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].errors).toHaveProperty('name');
        expect(ChefApplication.create).not.toHaveBeenCalled();
    });

    it('saves the application, emails the team and marks it notified', async () => {
        const saved = { ...validBody, notificationSent: false, save: jest.fn() };
        ChefApplication.create.mockResolvedValue(saved);
        emailService.sendChefApplicationNotification.mockResolvedValue({ success: true });
        const res = mockRes();

        await createChefApplication({ body: validBody }, res);

        expect(ChefApplication.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mona Ali', businessType: 'home_chef' }));
        expect(emailService.sendChefApplicationNotification).toHaveBeenCalledWith(saved);
        expect(saved.notificationSent).toBe(true);
        expect(saved.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('still succeeds when the notification email fails', async () => {
        const saved = { ...validBody, notificationSent: false, save: jest.fn() };
        ChefApplication.create.mockResolvedValue(saved);
        emailService.sendChefApplicationNotification.mockRejectedValue(new Error('SMTP down'));
        const res = mockRes();

        await createChefApplication({ body: validBody }, res);

        expect(saved.notificationSent).toBe(false);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 500 when saving fails', async () => {
        ChefApplication.create.mockRejectedValue(new Error('db down'));
        const res = mockRes();
        await createChefApplication({ body: validBody }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
