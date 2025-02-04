import { describe, it, expect } from 'vitest';
import * as bcrypt from '../src'; // Adjust the path as needed.
import bcryptjs from 'bcryptjs';

/**
 * Helper function to create a random alphanumeric string.
 *
 * @param length The desired length of the string.
 * @returns A randomly generated string.
 */
function randomString(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

describe('Bcrypt Implementation', () => {
    it('throws an error when the password is empty', () => {
        expect(() => bcrypt.hash('', 10)).toThrow(bcrypt.CryptoAssertError);
    });

    it('throws an error if the UTF‑8 encoded input (plus null terminator) exceeds 72 bytes', () => {
        // Here we create an input that exceeds the maximum allowed 71 bytes (plus the null terminator = 72 bytes).
        // For example, if we combine a userId (18 bytes), username (55 bytes) and a password, the total will be well over the limit.
        const userId = randomString(18);
        const username = randomString(55);
        const password = 'super-duper-secure-password';
        const combinedString = `${userId}:${username}:${password}`;
        expect(() => bcrypt.hash(combinedString, 10)).toThrow(bcrypt.CryptoAssertError);
    });

    it('hashes and compares a valid input exactly 71 bytes long correctly', () => {
        // Input of exactly 71 characters (71 bytes in ASCII).
        const validInput = 'a'.repeat(71);
        const hash = bcrypt.hash(validInput, 10);
        console.log("Hash for 71-byte input:", hash);
        const result = bcrypt.compare(validInput, hash);
        expect(result).toBe(true);
    });

    it('hashes and compares a typical short password correctly', () => {
        const validInput = 'test';
        const hash = bcrypt.hash(validInput, 10);
        console.log("Hash for 'test':", hash);
        const result = bcrypt.compare(validInput, hash);
        expect(result).toBe(true);
    });

    it('fails verification when the wrong password is provided', () => {
        const validInput = 'a'.repeat(71);
        const hash = bcrypt.hash(validInput, 10);
        // Change the last character: 70 'a's followed by a 'b'
        const wrongInput = 'a'.repeat(70) + 'b';
        const result = bcrypt.compare(wrongInput, hash);
        expect(result).toBe(false);
    });

    it('cross tests: verifies a bcryptjs-generated hash using our implementation', () => {
        const input = randomString(16);
        const hash = bcryptjs.hashSync(input, 10);
        console.log("bcryptjs hash:", hash);
        // Our implementation should verify the hash produced by bcryptjs.
        expect(bcrypt.compare(input, hash)).toBe(true);
    });

    it('cross tests: verifies our generated hash using bcryptjs', () => {
        const input = randomString(16);
        const hash = bcrypt.hash(input, 10);
        console.log("Our generated hash:", hash);
        // bcryptjs should also verify our generated hash.
        expect(bcryptjs.compareSync(input, hash)).toBe(true);
    });

    it('works correctly with various cost factors', () => {
        const input = randomString(16);
        for (let cost = 4; cost <= 12; cost += 2) {
            const hash = bcrypt.hash(input, cost as any);
            console.log(`Hash with cost ${cost}:`, hash);
            expect(bcrypt.compare(input, hash)).toBe(true);
            expect(bcryptjs.compareSync(input, hash)).toBe(true);
        }
    });

    it('handles multiple random inputs consistently', () => {
        for (let i = 0; i < 20; i++) {
            const input = randomString(16);
            const hash = bcrypt.hash(input, 10);
            expect(bcrypt.compare(input, hash)).toBe(true);
            expect(bcryptjs.compareSync(input, hash)).toBe(true);
        }
    });

    it('ensures that slight modifications in input cause verification failure', () => {
        const input = 'password123';
        const hash = bcrypt.hash(input, 10);
        // Appending an extra space or changing a character should result in a mismatch.
        expect(bcrypt.compare(input + ' ', hash)).toBe(false);
        expect(bcrypt.compare('password124', hash)).toBe(false);
        expect(bcrypt.compare('Password123', hash)).toBe(false);
    });

    it('generates different hashes for the same password on different invocations', () => {
        const input = 'consistentPassword';
        const hash1 = bcrypt.hash(input, 10);
        const hash2 = bcrypt.hash(input, 10);
        // Although the two hashes are different due to random salt, both should verify the password.
        expect(hash1).not.toEqual(hash2);
        expect(bcrypt.compare(input, hash1)).toBe(true);
        expect(bcrypt.compare(input, hash2)).toBe(true);
    });

    it('does not allow flawed usage where data beyond 72 bytes is silently ignored', () => {
        // In the flawed usage of some Node.js bcrypt implementations,
        // extra data beyond 72 bytes is ignored, so two different inputs could produce the same hash.
        // Our implementation, however, is strict and throws an error if the input exceeds 71 bytes (plus null terminator).
        const userId = "b91fa9b4-69f1-4779-8d45-73f8653057f3";
        const username = "my.very.long.username.with.more.characters@kondukto.io"; // 54 bytes in ASCII
        const password1 = "randomStrongPassword"; // valid password
        const password2 = "AAAAAAAAAAAAAAAAAAA";       // different password
        const validInput = userId + username + password1;
        const bypassInput = userId + username + password2;
        expect(() => bcrypt.hash(validInput, 10)).toThrow(bcrypt.CryptoAssertError);
        expect(() => bcrypt.hash(bypassInput, 10)).toThrow(bcrypt.CryptoAssertError);
    });
});
