Password2D — Developer Documentation

This documentation suite describes the Password2D monorepo as it exists in this repository. It documents the core engine, framework adapters (React, Vue, Angular, Vanilla), build & publish instructions, security model, and contribution workflow.

**Table of contents**

- [Architecture](architecture.md)
- [Engine internals](engine-internals.md)
- [UI adapters (React / Vue / Angular / Vanilla)](ui-adapters.md)
- [Security](security.md)

**Versioning policy**

- Packages use semver. The repository currently publishes `1.0.0` for the packages in `packages/*`.
- Backwards-incompatible API changes must increment the MAJOR version.
- Minor and patch versions follow feature additions and fixes respectively.


Notes: the content in these docs reflects the code present in this workspace as of this commit — API signatures, implementation details, and examples are taken directly from source files in `packages/*`.
