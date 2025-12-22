Security
========

This document explains the security model and recommendations for storing and validating Password2D data.

Entropy model

- The effective search space is a function of:
  - Grid dimensions: `rows * cols` cells
  - Characters per cell: up to `maxCharsPerCell`
  - Character set used (lowercase/uppercase/numbers/symbols)

- Example rough calculation: suppose a grid with R rows and C cols, each cell containing up to N characters chosen from an alphabet of size A. A conservative upper-bound on combinations (not accounting for positional separators) is A^(R*C*N). In practice many cells are empty, and ordering/coordinate encoding further multiplies complexity for an attacker.

Threat model & assumptions

- The backend receives the flattened string produced by `engine.getFlattened()` (e.g. `(col,row)value(2,0)abc...`). Attacker knowledge could vary:
  - Attacker knows grid size and coordinateMode (worst case)
  - Attacker does not know which cells are occupied (some leakage possible if client-side UI is exposed)

- Defenses assume the attacker obtains the flattened string (post-client). Therefore the flattened string must be treated as the actual password equivalent in server-side storage.

Comparison with a linear password

- Advantages: encoding of coordinates increases effective state space because same characters in different cells produce different flattened results.
- Disadvantages: user-chosen content can still be weak (e.g., only digits/short sequences). Use recommended UI guidance to encourage entropy: larger grid, increased `maxCharsPerCell`, and encourage mixed character sets.

Guidance for secure configuration

- Choose `rows` and `cols` to provide sufficient cells (for example 3×8 is the library default).
- Increase `maxCharsPerCell` if users can reasonably remember more characters per cell.
- Encourage at least one character class from each category: uppercase, lowercase, digits, symbols.

Backend handling recommendations

- Always hash the flattened string using a slow, memory-hard algorithm (Argon2id recommended). Alternatives: bcrypt with a strong cost factor.
- Always use per-password salts (Argon2/bcrypt handle salts internally when using proper libraries).
- Never log the flattened password in plaintext.
- Enforce transport-level security (HTTPS/TLS) when transmitting the flattened string.

Validation & rate-limiting

- Apply strong rate-limiting and account lockouts to reduce brute-force feasibility.
- Consider server-side complexity checks: minimum length of flattened string, presence of multiple cells, and diversity of character classes.

Notes on client-side masking

- The engine offers `masked` mode which adapters use to render `•`. Visual masking reduces shoulder-surfing but does not alter the flattened data.
