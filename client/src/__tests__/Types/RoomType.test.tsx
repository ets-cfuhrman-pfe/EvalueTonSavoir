import { RoomType } from "../../Types/RoomType";

const room: RoomType = {
    _id: '123',
    userId: '456',
    title: 'Test Room',
    created_at: '2025-02-21T00:00:00Z'
};

describe('RoomType', () => {
    test('creates a room with _id, userId, title, and created_at', () => {
        expect(room._id).toBe('123');
        expect(room.userId).toBe('456');
        expect(room.title).toBe('Test Room');
        expect(room.created_at).toBe('2025-02-21T00:00:00Z');
    });
});
