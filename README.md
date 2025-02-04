# A Modern, Secure Implementation of bcrypt for JavaScript/TypeScript

**Version:** 1.0.1  
**Date:** 2025-02-04

---

## Abstract

This document details our modern implementation of the bcrypt password hashing algorithm in JavaScript/TypeScript. In response to well-documented vulnerabilities in legacy libraries[^1][^2], our implementation adheres strictly to the bcrypt 2b specification, enforces opinionated input validation, and is designed for compatibility with established libraries. The aim is to provide a secure, maintainable, and high-assurance bcrypt library suitable for modern applications.

---

## 1. Introduction

Early JavaScript cryptography often lacked uniformity. Prominent libraries such as [node.bcrypt.js](https://github.com/kelektiv/node.bcrypt.js) and [bcrypt.js](https://www.npmjs.com/package/bcryptjs) exemplify this period. Despite their widespread adoption—with millions of weekly downloads—both implementations exhibit a critical vulnerability: they silently truncate passwords longer than 72 bytes without issuing an error, leading to hash collisions.

## 2. Technical Analysis

### 2.1 Legacy Behavior

Examination of the node.bcrypt.js source reveals the following logic:

```c
/* cap key_len at the actual maximum supported
 * length here to avoid integer wraparound */
if (key_len > 72)
    key_len = 72;
```

This code silently restricts the key length to 72 bytes. Consequently, when passwords exceed this size, the additional data is disregarded, potentially resulting in distinct inputs generating identical hashes.

### 2.2 Empirical Validation

The following example (in Node.js) illustrates the issue:

```js
const bcrypt = require('bcrypt');

const userid = "b91fa9b4-69f1-4779-8d45-73f8653057f3";
const username = "my.very.long.username.with.more.characters@kondukto.io";
const password1 = "randomStrongPassword";
const validInput = userid + username + password1;

const password2 = "AAAAAAAAAAAAAAAAAAA";
const bypassInput = userid + username + password2;

bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(validInput, salt, function(err, hash) {
        console.log(hash);
    });
    bcrypt.hash(bypassInput, salt, function(err, hash) {
        console.log(hash);
    });
});
```

## 3. Our Implementation

Our approach addresses these issues through an opinionated design that strictly enforces bcrypt's requirements. Key improvements include:

- **Strict Input Validation:** The UTF‑8 encoding of the password, plus a trailing null terminator, must not exceed 72 bytes. Exceeding this limit triggers an error rather than silent truncation.
- **Specification Adherence:** Implements bcrypt version 2b exactly as specified in the original paper, including mandatory keying rules.
- **Compatibility:** Fully compatible with the C implementation of bcrypt, providing a drop-in replacement for legacy libraries.
- **Modern Architecture:** Developed in TypeScript and uses the standard Web Cryptography API, some type magic to prevent mistakes, and supports  all Javascript runtimes.

The implementation follows the bcrypt algorithm as described in the [original paper][^3]. The process includes an enhanced key schedule, repeated key mixing for 2^cost rounds, and encryption of a canonical initialization vector 64 times to produce a 24-byte output (of which 23 bytes are used).

## 4. Usage Guide

### Installation

```bash
npm install @uswriting/bcrypt
```

The package includes both ESM and CommonJS builds, allowing for compatibility with older versions of Node.js:

```javascript
// ESM import
import { hash, compare } from '@uswriting/bcrypt';

// CommonJS require
const { hash, compare } = require('@uswriting/bcrypt');
```

### Basic Usage

```typescript
import { hash, compare } from '@uswriting/bcrypt';

const costFactor = 10;
const password = "mySecretPassword";

try {
  // Hash the password
  const hashedPassword = hash(password, costFactor);
  console.log("Hashed Password:", hashedPassword);

  // Verify the password against the hash
  const isValid = compare(password, hashedPassword);
  console.log("Password verification:", isValid);
} catch (err) {
  console.error("Error:", err);
}
```

### Handling Oversized Passwords

```typescript
import { hash, CryptoAssertError } from '@uswriting/bcrypt';

const longInput = "a".repeat(74); // Exceeds 71 bytes before null termination

try {
  const hashed = hash(longInput, 10);
  console.log(hashed);
} catch (err) {
  if (err instanceof CryptoAssertError) {
    console.error("Input validation error:", err.message);
  }
}
```

## 5. API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `hash(password: string, cost: VALID_COST): string` | Hashes the provided password using bcrypt. Enforces that the UTF‑8 encoding (plus a null terminator) does not exceed 72 bytes. |
| `compare(password: string, hash: string): boolean` | Verifies whether the provided password corresponds to the given bcrypt hash, using a constant‑time comparison to mitigate timing attacks. |
| `cryptRaw(rounds: number, salt: Uint8Array, password: Uint8Array): Uint8Array` | Computes the raw 24‑byte bcrypt hash using the Blowfish cipher; per the specification, only 23 bytes of the output are used. |

### Supporting Classes

- **BlowfishEngine:** Implements the core Blowfish cipher routines—including the F‑function, block encryption (Feistel network), and key expansion—according to the original specification.
- **CryptoAssertError:** A custom error type thrown when critical invariants (e.g., password length) are violated.

---

## License

MIT License - Free to use, modify, and distribute.

United States Writing Corporation  
2025-02-04

---

[^1]: https://n0rdy.foo/posts/20250121/okta-bcrypt-lessons-for-better-apis/
[^2]: https://kondukto.io/blog/okta-vulnerability-bcrypt-auth
[^3]: https://www.openbsd.org/papers/bcrypt-paper.pdf
