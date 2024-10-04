const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
};

module.exports = mockBcrypt;
