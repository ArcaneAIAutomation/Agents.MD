# Veritas Validators

This directory contains all validator modules for the Veritas Protocol.

## Validators

- `marketDataValidator.ts` - Market data cross-validation
- `socialSentimentValidator.ts` - Social sentiment validation
- `onChainValidator.ts` - On-chain data validation
- `newsCorrelationValidator.ts` - News correlation validation

Each validator implements validation logic for a specific data type and returns a `VeritasValidationResult`.
