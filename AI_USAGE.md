# AI_USAGE.md

## AI Tool Usage Disclosure

AI tools are allowed in this assessment.

We care about engineering judgment, verification, and ownership of the result — not whether you used AI.

If you used any AI assistant (ChatGPT, Copilot, Claude, etc.), document it here.

If you did not use AI tools, state that explicitly.

---

## Tools Used

List all AI tools used:

- Tool name: Github Copilot
- Version / model (if known): Claude Haiku 4.5
- How frequently used: (rare / occasional / heavy): occasional, line completions, suggestions, unit test cases.

---

## What AI Was Used For

Describe what the AI helped with:

- Code generation - Generating the MongoDB aggregation pipeline for the sensor aggregation endpoint.
- Debugging ideas - Helped brainstorm other options for solving the concurrency issue with the buffer flush, but ultimately I implemented a different approach.Mutex pattern was suggested but rejected due to complexity.
- Test scaffolding - Generated the initial structure of the unit test cases.
- Documentation - none in this case, but could be used for generating doc comments or README sections.
- Architecture reasoning - none
- Validation Logic - Suggested the API validation logic which I then implemented manually using class-validator.

---

## Verification Process

Explain how you verified AI-generated output:

- Wrote unit tests for the new API endpoint to verify correct behavior with various input parameters.
- Wrote integration tests to verify end-to-end functionality and interaction with the MongoDB database.
- Manually reviewed the generated aggregation pipeline to ensure it correctly implemented the required bucketing and calculations.
- added logging to the service method to help verify that the flush logic was working as intended during testing.
- Verified that the new endpoint correctly handles edge cases (e.g., no data, non-numeric values) through testing and code review.

---

## Corrections Made to AI Output

If AI produced incorrect or unsafe suggestions:

- AI suggested Mutex for concurrency control — rejected due to complexity and potential performance issues
- Implemented a simpler approach of immediately clearing the buffer and allowing new events to be buffered during the async flush operation, which maintains concurrency without blocking new events.
- AI suggested manual validation logic for API parameters — implemented using class-validator decorators for cleaner and more maintainable code.
- AI suggested a different structure for unit tests — modified to fit the Nestjs testing patterns and ensure proper setup/teardown of test data in MongoDB.